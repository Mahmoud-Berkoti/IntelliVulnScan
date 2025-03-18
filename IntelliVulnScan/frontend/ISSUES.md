# IntelliVulnScan Frontend Issues

## TypeScript Errors

### Dashboard.tsx
- Property 'vulnerabilitiesBySeverity' does not exist on type 'DashboardStats'. It should be 'vulnerability_by_severity'.
- Property 'vulnerabilitiesByType' does not exist on type 'DashboardStats'.
- Implicit 'any' types for parameters in map functions.

**Solution:**
```typescript
// Update references from:
stats.vulnerabilitiesBySeverity
// to:
stats.vulnerability_by_severity

// Add type annotations for map parameters:
stats.vulnerability_by_severity.map((entry: { severity: string, count: number }, index: number) => (...))
```

### MLModelDetail.tsx
- Possible undefined values for model.accuracy, model.precision, model.recall, and model.f1_score.
- Need to add null checks or default values.

**Solution:**
```typescript
// Add null checks or default values:
{(model.accuracy ? (model.accuracy * 100).toFixed(2) : 'N/A')}%
{(model.precision ? (model.precision * 100).toFixed(2) : 'N/A')}%
{(model.recall ? (model.recall * 100).toFixed(2) : 'N/A')}%
{(model.f1_score ? (model.f1_score * 100).toFixed(2) : 'N/A')}%
```

### MLModels.tsx
- Possible undefined values for model.accuracy and model.f1_score.
- Need to add null checks or default values.

**Solution:**
```typescript
// Add null checks or default values:
Accuracy: {(model.accuracy ? (model.accuracy * 100).toFixed(2) : 'N/A')}%
F1 Score: {(model.f1_score ? (model.f1_score * 100).toFixed(2) : 'N/A')}%
```

### Vulnerabilities.tsx
- Type mismatch for event handlers handleSeverityFilterChange and handleStatusFilterChange.
- Need to update the type definitions to match Material-UI's SelectChangeEvent.

**Solution:**
```typescript
// Import SelectChangeEvent from @mui/material
import { SelectChangeEvent } from '@mui/material';

// Update the event handler definitions:
const handleSeverityFilterChange = (event: SelectChangeEvent) => {
  setSeverityFilter(event.target.value as string);
  setPage(0);
};

const handleStatusFilterChange = (event: SelectChangeEvent) => {
  setStatusFilter(event.target.value as string);
  setPage(0);
};
```

### VulnerabilityDetail.tsx
- Property 'cvss_vector' does not exist on type 'VulnerabilityDetailData'.
- Need to add this property to the interface.
- Possible undefined values for vulnerability.asset.id and vulnerability.scan.id.
- Need to add null checks.

**Solution:**
```typescript
// Update the VulnerabilityDetailData interface:
interface VulnerabilityDetailData extends Vulnerability {
  cvss_vector?: string;
  // ... other properties
}

// Add null checks:
{vulnerability.cvss_vector && (
  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
    Vector: {vulnerability.cvss_vector}
  </Typography>
)}

// For asset and scan navigation:
<Button
  size="small"
  onClick={() => vulnerability.asset && navigate(`/assets/${vulnerability.asset.id}`)}
  disabled={!vulnerability.asset}
>
  View Asset
</Button>

<Button
  size="small"
  onClick={() => vulnerability.scan && navigate(`/scans/${vulnerability.scan.id}`)}
  disabled={!vulnerability.scan}
>
  View Scan
</Button>
```

### API Service
- Type mismatch in Axios interceptor configuration.
- Need to update the type definitions to match the latest Axios version.

**Solution:**
```typescript
// Update the type import:
import { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

// Update the interceptor:
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

## Missing Assets
- Missing favicon.ico, logo192.png, and logo512.png files in the public directory.
- These files should be created or the references should be removed from index.html and manifest.json.

**Solution:**
Create placeholder files or remove references:
1. Create empty files in the public directory:
   - favicon.ico
   - logo192.png
   - logo512.png
2. Or modify index.html and manifest.json to remove references to these files.

## Backend Connection
- Proxy errors when trying to connect to http://localhost:8000/.
- This is expected since we don't have a backend server running.
- For development without a backend, consider using mock data or a mock API service.

**Solution:**
1. Create a mock API service using MSW (Mock Service Worker) or json-server.
2. Update the proxy configuration in package.json to point to the mock server.
3. Implement mock data in the application for development.

## Environment Setup Issues
- PowerShell execution policy restrictions.
- Can be bypassed using `powershell -ExecutionPolicy Bypass -Command "npm command"`.
- For a permanent solution, run PowerShell as administrator and execute: `Set-ExecutionPolicy RemoteSigned`.

**Solution:**
1. For temporary bypass:
   ```
   powershell -ExecutionPolicy Bypass -Command "npm start"
   ```
2. For permanent solution (requires admin privileges):
   ```
   powershell -Command "Start-Process PowerShell -Verb RunAs -ArgumentList 'Set-ExecutionPolicy RemoteSigned -Force'"
   ```

## Next Steps
1. Fix TypeScript errors by updating interfaces and adding null checks.
2. Create or obtain missing asset files.
3. Consider implementing mock API services for development without a backend.
4. Update the type definitions to match the latest versions of libraries.
5. Run the application with `npm start` after fixing these issues. 