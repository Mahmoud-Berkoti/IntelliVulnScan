import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function seed() {
  console.log('Starting database seeding...');

  // Clear existing data
  await prisma.$transaction([
    prisma.scanAsset.deleteMany(),
    prisma.assetVulnerability.deleteMany(),
    prisma.tagsOnAssets.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.apiKey.deleteMany(),
    prisma.settings.deleteMany(),
    prisma.report.deleteMany(),
    prisma.scan.deleteMany(),
    prisma.vulnerability.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.user.deleteMany(),
    prisma.mLModel.deleteMany(),
  ]);

  console.log('Creating users...');
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@intellivulnscan.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN'
    }
  });

  // Create regular user
  const userPassword = await bcrypt.hash('password123', 10);
  const regularUser = await prisma.user.create({
    data: {
      email: 'user@intellivulnscan.com',
      name: 'Regular User',
      passwordHash: userPassword,
      role: 'USER'
    }
  });

  console.log('Creating user settings...');
  
  // Create settings for admin
  await prisma.settings.create({
    data: {
      userId: adminUser.id,
      scanFrequency: 'daily',
      retentionPeriod: 180,
      enableAutoScan: true,
      enableMlPredictions: true,
      defaultTheme: 'dark',
      itemsPerPage: 25,
      notificationEmail: 'admin@intellivulnscan.com',
      scanSettings: JSON.stringify({
        concurrentScans: 3,
        defaultTimeout: 3600,
        reportFormat: 'PDF',
        severity: ['critical', 'high', 'medium']
      }),
      uiSettings: JSON.stringify({
        dashboardLayout: 'grid',
        defaultView: 'list',
        chartColors: {
          critical: '#ff0000',
          high: '#ff8c00',
          medium: '#ffff00',
          low: '#008000',
          info: '#0000ff'
        }
      }),
      integrations: JSON.stringify({
        email: {
          enabled: true,
          smtpServer: 'smtp.example.com',
          port: 587
        },
        slack: {
          enabled: false,
          webhookUrl: ''
        }
      })
    }
  });

  // Create settings for regular user
  await prisma.settings.create({
    data: {
      userId: regularUser.id,
      scanFrequency: 'weekly',
      enableAutoScan: true,
      enableMlPredictions: false,
      defaultTheme: 'system',
      notificationEmail: 'user@intellivulnscan.com',
      scanSettings: JSON.stringify({
        concurrentScans: 1,
        defaultTimeout: 1800,
        reportFormat: 'PDF',
        severity: ['critical', 'high']
      }),
      uiSettings: JSON.stringify({
        dashboardLayout: 'list',
        defaultView: 'grid',
        chartColors: {
          critical: '#ff0000',
          high: '#ff8c00',
          medium: '#ffff00',
          low: '#008000',
          info: '#0000ff'
        }
      }),
      integrations: JSON.stringify({
        email: {
          enabled: true,
          smtpServer: 'smtp.example.com',
          port: 587
        },
        slack: {
          enabled: false,
          webhookUrl: ''
        }
      })
    }
  });

  console.log('Creating API keys...');
  
  // API key for admin
  const adminApiKey = crypto.randomBytes(16).toString('hex');
  await prisma.apiKey.create({
    data: {
      name: 'Admin API Key',
      key: adminApiKey,
      userId: adminUser.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      lastUsed: null
    }
  });

  // API key for regular user
  const userApiKey = crypto.randomBytes(16).toString('hex');
  await prisma.apiKey.create({
    data: {
      name: 'User API Key',
      key: userApiKey,
      userId: regularUser.id,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
      lastUsed: new Date()
    }
  });

  console.log('Creating tags...');
  
  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: 'Production',
        color: '#e53935',
        description: 'Production systems'
      }
    }),
    prisma.tag.create({
      data: {
        name: 'Development',
        color: '#4caf50',
        description: 'Development systems'
      }
    }),
    prisma.tag.create({
      data: {
        name: 'Critical',
        color: '#f44336',
        description: 'Critical infrastructure'
      }
    }),
    prisma.tag.create({
      data: {
        name: 'External',
        color: '#2196f3',
        description: 'Internet-facing systems'
      }
    }),
    prisma.tag.create({
      data: {
        name: 'Internal',
        color: '#9c27b0',
        description: 'Internal systems'
      }
    })
  ]);

  console.log('Creating assets...');
  
  // Create assets for admin
  const adminAssets = await Promise.all([
    prisma.asset.create({
      data: {
        name: 'Web Server',
        description: 'Main production web server',
        ipAddress: '192.168.1.10',
        hostname: 'web-prod-01',
        macAddress: '00:1A:C2:7B:00:47',
        assetType: 'server',
        operatingSystem: 'Ubuntu 20.04 LTS',
        criticality: 'high',
        status: 'active',
        ownerId: adminUser.id,
        metadata: JSON.stringify({
          location: 'Main Data Center',
          department: 'IT',
          purchased: '2022-01-15',
          vendor: 'Dell',
          model: 'PowerEdge R740'
        })
      }
    }),
    prisma.asset.create({
      data: {
        name: 'API Server',
        description: 'REST API server',
        ipAddress: '192.168.1.11',
        hostname: 'api-prod-01',
        assetType: 'server',
        operatingSystem: 'Ubuntu 20.04 LTS',
        criticality: 'high',
        status: 'active',
        ownerId: adminUser.id,
        metadata: JSON.stringify({
          location: 'Main Data Center',
          department: 'IT',
          purchased: '2022-01-15',
          vendor: 'Dell',
          model: 'PowerEdge R740'
        })
      }
    }),
    prisma.asset.create({
      data: {
        name: 'Database Server',
        description: 'PostgreSQL database server',
        ipAddress: '192.168.1.12',
        hostname: 'db-prod-01',
        assetType: 'server',
        operatingSystem: 'Ubuntu 20.04 LTS',
        criticality: 'critical',
        status: 'active',
        ownerId: adminUser.id,
        metadata: JSON.stringify({
          location: 'Main Data Center',
          department: 'IT',
          purchased: '2022-01-15',
          vendor: 'Dell',
          model: 'PowerEdge R740'
        })
      }
    })
  ]);

  // Create assets for regular user
  const userAssets = await Promise.all([
    prisma.asset.create({
      data: {
        name: 'Development Server',
        description: 'Development environment',
        ipAddress: '192.168.2.10',
        hostname: 'dev-01',
        assetType: 'server',
        operatingSystem: 'Ubuntu 22.04 LTS',
        criticality: 'medium',
        status: 'active',
        ownerId: regularUser.id,
        metadata: JSON.stringify({
          location: 'Office',
          department: 'Development',
          purchased: '2022-06-10',
          vendor: 'HP',
          model: 'ProLiant DL360'
        })
      }
    }),
    prisma.asset.create({
      data: {
        name: 'Test Application',
        description: 'Test web application',
        hostname: 'test-app',
        assetType: 'application',
        criticality: 'low',
        status: 'active',
        ownerId: regularUser.id,
        metadata: JSON.stringify({
          repository: 'https://github.com/example/test-app',
          language: 'JavaScript',
          framework: 'React'
        })
      }
    })
  ]);

  console.log('Assigning tags to assets...');
  
  // Assign tags to assets
  for (const asset of adminAssets) {
    // Add individual tags one by one since SQLite doesn't support createMany
    await prisma.tagsOnAssets.create({
      data: {
        assetId: asset.id,
        tagId: tags[0].id, // Production
        addedAt: new Date()
      }
    });
    
    await prisma.tagsOnAssets.create({
      data: {
        assetId: asset.id,
        tagId: tags[2].id, // Critical
        addedAt: new Date()
      }
    });
    
    if (asset.name === 'Web Server') {
      await prisma.tagsOnAssets.create({
        data: {
          assetId: asset.id,
          tagId: tags[3].id, // External
          addedAt: new Date()
        }
      });
    } else {
      await prisma.tagsOnAssets.create({
        data: {
          assetId: asset.id,
          tagId: tags[4].id, // Internal
          addedAt: new Date()
        }
      });
    }
  }

  for (const asset of userAssets) {
    await prisma.tagsOnAssets.create({
      data: {
        assetId: asset.id,
        tagId: tags[1].id, // Development
        addedAt: new Date()
      }
    });
  }

  console.log('Creating vulnerabilities...');
  
  // Create vulnerabilities
  const vulnerabilities = await Promise.all([
    prisma.vulnerability.create({
      data: {
        title: 'SQL Injection',
        description: 'SQL injection vulnerability in login form',
        cveId: 'CVE-2022-1234',
        cvssScore: 8.7,
        severity: 'high',
        status: 'open',
        discoveredById: adminUser.id,
        remediation: 'Use parameterized queries or prepared statements',
        references: JSON.stringify([
          'https://owasp.org/www-community/attacks/SQL_Injection',
          'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-1234'
        ])
      }
    }),
    prisma.vulnerability.create({
      data: {
        title: 'Cross-Site Scripting (XSS)',
        description: 'Reflected XSS vulnerability in search feature',
        cveId: 'CVE-2022-5678',
        cvssScore: 6.5,
        severity: 'medium',
        status: 'open',
        discoveredById: adminUser.id,
        remediation: 'Implement proper output encoding and Content-Security-Policy',
        references: JSON.stringify([
          'https://owasp.org/www-community/attacks/xss/',
          'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-5678'
        ])
      }
    }),
    prisma.vulnerability.create({
      data: {
        title: 'Outdated Software',
        description: 'Server is running outdated version of nginx with known vulnerabilities',
        cvssScore: 5.2,
        severity: 'medium',
        status: 'open',
        discoveredById: regularUser.id,
        remediation: 'Update nginx to the latest stable version',
        references: JSON.stringify([
          'https://nginx.org/en/security_advisories.html'
        ])
      }
    }),
    prisma.vulnerability.create({
      data: {
        title: 'Insecure Direct Object Reference',
        description: 'Application allows unauthorized access to user data through direct object references',
        cvssScore: 7.1,
        severity: 'high',
        status: 'open',
        discoveredById: adminUser.id,
        remediation: 'Implement proper access controls and validate user permissions',
        references: JSON.stringify([
          'https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control'
        ])
      }
    }),
    prisma.vulnerability.create({
      data: {
        title: 'Weak Password Policy',
        description: 'Application allows weak passwords that are easily guessable',
        cvssScore: 4.3,
        severity: 'medium',
        status: 'open',
        discoveredById: regularUser.id,
        remediation: 'Implement stronger password policy with minimum complexity requirements',
        references: JSON.stringify([
          'https://pages.nist.gov/800-63-3/sp800-63b.html#sec5'
        ])
      }
    })
  ]);

  console.log('Assigning vulnerabilities to assets...');
  
  // Assign vulnerabilities to assets
  // SQL Injection on Web Server
  await prisma.assetVulnerability.create({
    data: {
      assetId: adminAssets[0].id,
      vulnerabilityId: vulnerabilities[0].id,
      status: 'open',
      addedAt: new Date(),
      updatedAt: new Date(),
      notes: 'Found during manual penetration testing'
    }
  });

  // XSS on Web Server
  await prisma.assetVulnerability.create({
    data: {
      assetId: adminAssets[0].id,
      vulnerabilityId: vulnerabilities[1].id,
      status: 'open',
      addedAt: new Date(),
      updatedAt: new Date(),
      notes: 'Found during automated scanning'
    }
  });

  // Outdated Software on API Server
  await prisma.assetVulnerability.create({
    data: {
      assetId: adminAssets[1].id,
      vulnerabilityId: vulnerabilities[2].id,
      status: 'open',
      addedAt: new Date(),
      updatedAt: new Date(),
      notes: 'Version nginx/1.18.0'
    }
  });

  // IDOR on API Server
  await prisma.assetVulnerability.create({
    data: {
      assetId: adminAssets[1].id,
      vulnerabilityId: vulnerabilities[3].id,
      status: 'open',
      addedAt: new Date(),
      updatedAt: new Date(),
      notes: 'Found during code review'
    }
  });

  // Weak Password Policy on User App
  await prisma.assetVulnerability.create({
    data: {
      assetId: userAssets[1].id,
      vulnerabilityId: vulnerabilities[4].id,
      status: 'open',
      addedAt: new Date(),
      updatedAt: new Date(),
      notes: 'Current policy only requires 6 characters'
    }
  });

  console.log('Creating scans...');
  
  // Create scans
  const adminScan = await prisma.scan.create({
    data: {
      name: 'Weekly Production Scan',
      description: 'Automated weekly scan of production systems',
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3600000), // 1 hour after start
      status: 'COMPLETED',
      scanType: 'full',
      initiatedById: adminUser.id,
      results: JSON.stringify({
        totalVulnerabilities: 12,
        critical: 2,
        high: 5,
        medium: 3,
        low: 2,
        info: 0,
        newFindings: 3,
        duration: 3570 // seconds
      }),
      metadata: JSON.stringify({
        scanEngine: 'OpenVAS 21.4.3',
        scanProfile: 'Full and deep',
        notes: 'Scan completed successfully'
      })
    }
  });

  const userScan = await prisma.scan.create({
    data: {
      name: 'Development Environment Scan',
      description: 'Scan of development environment',
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1800000), // 30 minutes after start
      status: 'COMPLETED',
      scanType: 'basic',
      initiatedById: regularUser.id,
      results: JSON.stringify({
        totalVulnerabilities: 5,
        critical: 0,
        high: 1,
        medium: 2,
        low: 2,
        info: 0,
        newFindings: 1,
        duration: 1785 // seconds
      }),
      metadata: JSON.stringify({
        scanEngine: 'OpenVAS 21.4.3',
        scanProfile: 'Basic',
        notes: 'Scan completed successfully'
      })
    }
  });

  console.log('Assigning assets to scans...');
  
  // Assign assets to scans
  // Admin scan assets
  await prisma.scanAsset.create({
    data: {
      scanId: adminScan.id,
      assetId: adminAssets[0].id,
      scannedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'completed',
      results: JSON.stringify({
        vulnerabilities: 5,
        critical: 1,
        high: 2,
        medium: 1,
        low: 1,
        info: 0
      })
    }
  });
  
  await prisma.scanAsset.create({
    data: {
      scanId: adminScan.id,
      assetId: adminAssets[1].id,
      scannedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 1200000),
      status: 'completed',
      results: JSON.stringify({
        vulnerabilities: 4,
        critical: 1,
        high: 1,
        medium: 1,
        low: 1,
        info: 0
      })
    }
  });
  
  await prisma.scanAsset.create({
    data: {
      scanId: adminScan.id,
      assetId: adminAssets[2].id,
      scannedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2400000),
      status: 'completed',
      results: JSON.stringify({
        vulnerabilities: 3,
        critical: 0,
        high: 2,
        medium: 1,
        low: 0,
        info: 0
      })
    }
  });

  // User scan assets
  await prisma.scanAsset.create({
    data: {
      scanId: userScan.id,
      assetId: userAssets[0].id,
      scannedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'completed',
      results: JSON.stringify({
        vulnerabilities: 3,
        critical: 0,
        high: 1,
        medium: 1,
        low: 1,
        info: 0
      })
    }
  });
  
  await prisma.scanAsset.create({
    data: {
      scanId: userScan.id,
      assetId: userAssets[1].id,
      scannedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 900000),
      status: 'completed',
      results: JSON.stringify({
        vulnerabilities: 2,
        critical: 0,
        high: 0,
        medium: 1,
        low: 1,
        info: 0
      })
    }
  });

  console.log('Creating reports...');
  
  // Create reports
  await prisma.report.create({
    data: {
      name: 'Weekly Security Report',
      description: 'Comprehensive security assessment for week 22',
      reportType: 'security',
      format: 'PDF',
      createdById: adminUser.id,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      parameters: JSON.stringify({
        includeExecutiveSummary: true,
        includeRemediation: true,
        includeRiskScores: true,
        customLogo: true
      }),
      downloadUrl: '/reports/weekly-security-report-22.pdf',
      schedule: 'weekly'
    }
  });

  await prisma.report.create({
    data: {
      name: 'Development Environment Security Assessment',
      description: 'Security assessment for development infrastructure',
      reportType: 'assessment',
      format: 'PDF',
      createdById: regularUser.id,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      parameters: JSON.stringify({
        includeExecutiveSummary: false,
        includeRemediation: true,
        includeRiskScores: true,
        customLogo: false
      }),
      downloadUrl: '/reports/dev-security-assessment.pdf'
    }
  });

  console.log('Creating ML models...');
  
  // Create ML models
  await prisma.mLModel.create({
    data: {
      name: 'Vulnerability Risk Predictor',
      description: 'Predicts risk level of vulnerabilities based on historical data',
      modelType: 'risk-prediction',
      version: '1.2.0',
      accuracy: 0.87,
      precision: 0.85,
      recall: 0.83,
      f1Score: 0.84,
      trainedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'active',
      trainingDataset: JSON.stringify({
        name: 'historical-vulnerabilities-2022',
        records: 15000,
        features: 24,
        source: 'internal-data-warehouse'
      }),
      hyperparameters: JSON.stringify({
        learningRate: 0.01,
        maxDepth: 8,
        numEstimators: 200,
        minSamplesSplit: 5
      }),
      metadata: JSON.stringify({
        framework: 'scikit-learn',
        algorithm: 'RandomForest',
        trainTime: 1850, // seconds
        notes: 'Best performing model in cross-validation'
      })
    }
  });

  await prisma.mLModel.create({
    data: {
      name: 'Vulnerability Detection Model',
      description: 'Detects vulnerabilities in code using NLP',
      modelType: 'detection',
      version: '0.9.1',
      accuracy: 0.82,
      precision: 0.79,
      recall: 0.85,
      f1Score: 0.82,
      trainedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
      lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: 'active',
      trainingDataset: JSON.stringify({
        name: 'code-vulnerabilities-dataset',
        records: 12000,
        features: 30,
        source: 'github-public-repos'
      }),
      hyperparameters: JSON.stringify({
        embeddingSize: 128,
        hiddenLayers: 3,
        hiddenUnits: 256,
        dropout: 0.2
      }),
      metadata: JSON.stringify({
        framework: 'tensorflow',
        algorithm: 'LSTM',
        trainTime: 14500, // seconds
        notes: 'Experimental model, continuous improvement'
      })
    }
  });

  console.log('Seeding completed successfully!');
}

seed()
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 