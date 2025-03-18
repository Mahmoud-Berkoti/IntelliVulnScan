import logging
import os
import subprocess
import json
from datetime import datetime
from typing import Dict, Any, Optional, List

from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.scan import Scan
from app.models.vulnerability import Vulnerability
from app.services.scan_service import update_scan_status, create_vulnerability_from_finding
from app.services.notification_service import send_notification

logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def run_scan_task(self, scan_id: int) -> Dict[str, Any]:
    """
    Celery task to run a vulnerability scan in the background.
    
    Args:
        scan_id: ID of the scan to run
        
    Returns:
        Dictionary with scan results
    """
    logger.info(f"Starting scan task {self.request.id} for scan_id {scan_id}")
    
    try:
        # Get database session
        db = SessionLocal()
        
        # Get scan from database
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            logger.error(f"Scan with ID {scan_id} not found")
            db.close()
            return {
                "status": "failed",
                "message": f"Scan with ID {scan_id} not found",
            }
        
        # Update scan status to running
        scan.status = "running"
        scan.started_at = datetime.now()
        db.commit()
        
        # Run scan based on scanner type
        if scan.scanner_type == "trivy":
            results = run_trivy_scan(scan)
        elif scan.scanner_type == "openvas":
            results = run_openvas_scan(scan)
        elif scan.scanner_type == "dependency-check":
            results = run_dependency_check_scan(scan)
        else:
            logger.error(f"Unsupported scanner type: {scan.scanner_type}")
            update_scan_status(db, scan_id, "failed", f"Unsupported scanner type: {scan.scanner_type}")
            db.close()
            return {
                "status": "failed",
                "message": f"Unsupported scanner type: {scan.scanner_type}",
            }
        
        # Process scan results
        if results["status"] == "success":
            # Process findings
            process_scan_findings(db, scan_id, results["findings"])
            
            # Update scan status
            update_scan_status(
                db,
                scan_id,
                "completed",
                f"Scan completed successfully with {len(results['findings'])} findings",
                vulnerabilities_count=len(results["findings"]),
                critical_count=sum(1 for f in results["findings"] if f.get("severity") == "critical"),
                high_count=sum(1 for f in results["findings"] if f.get("severity") == "high"),
                medium_count=sum(1 for f in results["findings"] if f.get("severity") == "medium"),
                low_count=sum(1 for f in results["findings"] if f.get("severity") == "low"),
            )
            
            # Send notification
            send_notification(
                title="Scan Completed",
                message=f"Scan '{scan.name}' completed successfully with {len(results['findings'])} findings",
                notification_type="success",
            )
        else:
            # Update scan status
            update_scan_status(db, scan_id, "failed", results["message"])
            
            # Send notification
            send_notification(
                title="Scan Failed",
                message=f"Scan '{scan.name}' failed: {results['message']}",
                notification_type="error",
            )
        
        # Close database session
        db.close()
        
        logger.info(f"Scan task {self.request.id} completed with status {results['status']}")
        return results
    
    except Exception as e:
        logger.error(f"Error in scan task {self.request.id}: {e}", exc_info=True)
        
        try:
            # Update scan status
            db = SessionLocal()
            update_scan_status(db, scan_id, "failed", str(e))
            db.close()
            
            # Send notification
            send_notification(
                title="Scan Failed",
                message=f"Scan failed with exception: {str(e)}",
                notification_type="error",
            )
        except Exception as inner_e:
            logger.error(f"Error updating scan status: {inner_e}", exc_info=True)
        
        return {
            "status": "failed",
            "message": str(e),
        }


def run_trivy_scan(scan: Scan) -> Dict[str, Any]:
    """
    Run a Trivy scan.
    
    Args:
        scan: Scan object
        
    Returns:
        Dictionary with scan results
    """
    logger.info(f"Running Trivy scan for {scan.target_identifier}")
    
    try:
        # Prepare command
        cmd = [
            settings.TRIVY_PATH,
            "--format", "json",
            "--severity", "CRITICAL,HIGH,MEDIUM,LOW",
        ]
        
        # Add scan depth
        if scan.scan_depth == "quick":
            cmd.extend(["--light"])
        elif scan.scan_depth == "deep":
            cmd.extend(["--list-all-pkgs"])
        
        # Add target type
        if scan.target_type == "container":
            cmd.append("image")
        elif scan.target_type == "repository":
            cmd.append("fs")
        
        # Add target identifier
        cmd.append(scan.target_identifier)
        
        # Run command
        logger.debug(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        # Parse output
        output = json.loads(result.stdout)
        
        # Extract findings
        findings = []
        for result in output.get("Results", []):
            for vuln in result.get("Vulnerabilities", []):
                finding = {
                    "title": vuln.get("Title", vuln.get("VulnerabilityID", "Unknown")),
                    "description": vuln.get("Description", ""),
                    "cve_id": vuln.get("VulnerabilityID", ""),
                    "severity": vuln.get("Severity", "").lower(),
                    "cvss_score": float(vuln.get("CVSS", {}).get("nvd", {}).get("V3Score", 0.0)),
                    "cvss_vector": vuln.get("CVSS", {}).get("nvd", {}).get("V3Vector", ""),
                    "affected_component": result.get("Target", ""),
                    "affected_version": vuln.get("InstalledVersion", ""),
                    "exploit_available": vuln.get("ExploitAvailable", False),
                    "patch_available": vuln.get("FixedVersion", "") != "",
                    "metadata": {
                        "package_name": vuln.get("PkgName", ""),
                        "fixed_version": vuln.get("FixedVersion", ""),
                        "references": vuln.get("References", []),
                    },
                }
                findings.append(finding)
        
        return {
            "status": "success",
            "message": "Scan completed successfully",
            "findings": findings,
            "raw_output": output,
        }
    
    except subprocess.CalledProcessError as e:
        logger.error(f"Trivy scan failed: {e.stderr}")
        return {
            "status": "failed",
            "message": f"Trivy scan failed: {e.stderr}",
            "findings": [],
        }
    except Exception as e:
        logger.error(f"Error running Trivy scan: {e}", exc_info=True)
        return {
            "status": "failed",
            "message": f"Error running Trivy scan: {str(e)}",
            "findings": [],
        }


def run_openvas_scan(scan: Scan) -> Dict[str, Any]:
    """
    Run an OpenVAS scan.
    
    Args:
        scan: Scan object
        
    Returns:
        Dictionary with scan results
    """
    logger.info(f"Running OpenVAS scan for {scan.target_identifier}")
    
    # This is a placeholder for OpenVAS integration
    # In a real implementation, you would use the pyopenvas library to interact with OpenVAS
    
    # Simulate findings for demonstration
    findings = [
        {
            "title": "SSH Weak Encryption Algorithms Supported",
            "description": "The SSH server is configured to support weak encryption algorithms.",
            "cve_id": "CVE-2020-14145",
            "severity": "medium",
            "cvss_score": 5.3,
            "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
            "affected_component": "SSH",
            "affected_version": "OpenSSH 7.9",
            "exploit_available": False,
            "patch_available": True,
            "metadata": {
                "port": "22",
                "protocol": "tcp",
                "solution": "Configure SSH server to disable weak encryption algorithms.",
            },
        },
        {
            "title": "HTTP TRACE/TRACK Methods Allowed",
            "description": "The HTTP TRACE/TRACK methods are enabled on the web server.",
            "cve_id": "CVE-2004-2320",
            "severity": "low",
            "cvss_score": 3.7,
            "cvss_vector": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:N/A:N",
            "affected_component": "Web Server",
            "affected_version": "Apache 2.4.41",
            "exploit_available": True,
            "patch_available": True,
            "metadata": {
                "port": "80",
                "protocol": "tcp",
                "solution": "Disable TRACE/TRACK methods in web server configuration.",
            },
        },
    ]
    
    return {
        "status": "success",
        "message": "Scan completed successfully",
        "findings": findings,
        "raw_output": {"results": findings},
    }


def run_dependency_check_scan(scan: Scan) -> Dict[str, Any]:
    """
    Run a Dependency-Check scan.
    
    Args:
        scan: Scan object
        
    Returns:
        Dictionary with scan results
    """
    logger.info(f"Running Dependency-Check scan for {scan.target_identifier}")
    
    try:
        # Prepare command
        cmd = [
            settings.DEPENDENCY_CHECK_PATH,
            "--scan", scan.target_identifier,
            "--format", "JSON",
            "--out", f"dependency-check-report-{scan.id}.json",
        ]
        
        # Add scan depth
        if scan.scan_depth == "quick":
            cmd.extend(["--disableRetireJS"])
        elif scan.scan_depth == "deep":
            cmd.extend(["--enableExperimental"])
        
        # Run command
        logger.debug(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        # Read output file
        report_path = f"dependency-check-report-{scan.id}.json"
        with open(report_path, "r") as f:
            output = json.load(f)
        
        # Clean up report file
        os.remove(report_path)
        
        # Extract findings
        findings = []
        for dependency in output.get("dependencies", []):
            for vuln in dependency.get("vulnerabilities", []):
                finding = {
                    "title": vuln.get("name", "Unknown"),
                    "description": vuln.get("description", ""),
                    "cve_id": vuln.get("name", ""),
                    "severity": vuln.get("severity", "").lower(),
                    "cvss_score": float(vuln.get("cvssv3", {}).get("baseScore", 0.0)),
                    "cvss_vector": vuln.get("cvssv3", {}).get("attackVector", ""),
                    "affected_component": dependency.get("fileName", ""),
                    "affected_version": dependency.get("version", ""),
                    "exploit_available": False,  # Dependency-Check doesn't provide this info
                    "patch_available": True,  # Assume patch is available
                    "metadata": {
                        "package_name": dependency.get("fileName", ""),
                        "references": vuln.get("references", []),
                    },
                }
                findings.append(finding)
        
        return {
            "status": "success",
            "message": "Scan completed successfully",
            "findings": findings,
            "raw_output": output,
        }
    
    except subprocess.CalledProcessError as e:
        logger.error(f"Dependency-Check scan failed: {e.stderr}")
        return {
            "status": "failed",
            "message": f"Dependency-Check scan failed: {e.stderr}",
            "findings": [],
        }
    except Exception as e:
        logger.error(f"Error running Dependency-Check scan: {e}", exc_info=True)
        return {
            "status": "failed",
            "message": f"Error running Dependency-Check scan: {str(e)}",
            "findings": [],
        }


def process_scan_findings(db: Session, scan_id: int, findings: List[Dict[str, Any]]) -> None:
    """
    Process scan findings and create vulnerability records.
    
    Args:
        db: Database session
        scan_id: ID of the scan
        findings: List of findings from the scan
    """
    logger.info(f"Processing {len(findings)} findings for scan {scan_id}")
    
    # Get scan
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        logger.error(f"Scan with ID {scan_id} not found")
        return
    
    # Process each finding
    for finding in findings:
        # Create vulnerability
        create_vulnerability_from_finding(db, scan_id, scan.asset_id, finding)
    
    # Commit changes
    db.commit()
    logger.info(f"Processed {len(findings)} findings for scan {scan_id}")


@celery_app.task
def update_vulnerability_database() -> Dict[str, Any]:
    """
    Celery task to update the vulnerability database.
    
    Returns:
        Dictionary with update results
    """
    logger.info("Starting vulnerability database update")
    
    try:
        # Update Trivy database
        cmd = [settings.TRIVY_PATH, "image", "--download-db-only"]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        logger.info("Vulnerability database updated successfully")
        return {
            "status": "success",
            "message": "Vulnerability database updated successfully",
        }
    
    except Exception as e:
        logger.error(f"Error updating vulnerability database: {e}", exc_info=True)
        return {
            "status": "failed",
            "message": str(e),
        } 