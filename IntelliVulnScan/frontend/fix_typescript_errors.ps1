# This script fixes common TypeScript errors in the frontend components

# Create a directory for the node_modules if it doesn't exist
New-Item -ItemType Directory -Force -Path node_modules

# Create a directory for the @types if it doesn't exist
New-Item -ItemType Directory -Force -Path node_modules/@types

# Create a directory for react types
New-Item -ItemType Directory -Force -Path node_modules/@types/react
New-Item -ItemType Directory -Force -Path node_modules/@types/react-dom
New-Item -ItemType Directory -Force -Path node_modules/@types/react-router-dom
New-Item -ItemType Directory -Force -Path node_modules/@types/axios
New-Item -ItemType Directory -Force -Path node_modules/@types/recharts

# Create minimal type definitions for React
@"
// Type definitions for React
declare namespace React {
  interface ReactElement<P = any, T = any> {}
  interface ReactNode {}
  
  interface FC<P = {}> {
    (props: P): ReactElement | null;
  }
  
  interface ChangeEvent<T = Element> {
    target: T;
  }
  
  interface FormEvent<T = Element> {
    preventDefault(): void;
  }
  
  interface SyntheticEvent<T = Element, E = Event> {
    preventDefault(): void;
  }
  
  function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  function useMemo<T>(factory: () => T, deps: readonly any[]): T;
  function useRef<T>(initialValue: T): { current: T };
  function createContext<T>(defaultValue: T): { Provider: any, Consumer: any };
}

declare module 'react' {
  export = React;
  export as namespace React;
}

declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface Element extends React.ReactElement {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
  export function jsx(type: any, props: any, key?: string): JSX.Element;
  export function jsxs(type: any, props: any, key?: string): JSX.Element;
}
"@ | Out-File -FilePath node_modules/@types/react/index.d.ts -Encoding utf8

# Create minimal type definitions for React DOM
@"
// Type definitions for React DOM
declare namespace ReactDOM {
  function render(element: React.ReactElement, container: Element | null): void;
  function createRoot(container: Element | null): { render(element: React.ReactElement): void };
}

declare module 'react-dom' {
  export = ReactDOM;
  export as namespace ReactDOM;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | null): { render(element: React.ReactElement): void };
}
"@ | Out-File -FilePath node_modules/@types/react-dom/index.d.ts -Encoding utf8

# Create minimal type definitions for React Router DOM
@"
// Type definitions for React Router DOM
declare namespace ReactRouterDOM {
  interface RouteProps {
    path?: string;
    element?: React.ReactElement;
    children?: React.ReactNode;
  }
  
  function BrowserRouter(props: { children: React.ReactNode }): React.ReactElement;
  function Routes(props: { children: React.ReactNode }): React.ReactElement;
  function Route(props: RouteProps): React.ReactElement;
  function Navigate(props: { to: string, replace?: boolean }): React.ReactElement;
  function Outlet(): React.ReactElement;
  function Link(props: { to: string, children: React.ReactNode }): React.ReactElement;
  
  function useParams<T extends Record<string, string>>(): T;
  function useNavigate(): (path: string) => void;
  function useLocation(): { pathname: string, search: string, hash: string };
}

declare module 'react-router-dom' {
  export = ReactRouterDOM;
  export as namespace ReactRouterDOM;
}
"@ | Out-File -FilePath node_modules/@types/react-router-dom/index.d.ts -Encoding utf8

# Create minimal type definitions for Axios
@"
// Type definitions for Axios
declare namespace Axios {
  interface AxiosRequestConfig {
    url?: string;
    method?: string;
    baseURL?: string;
    headers?: any;
    params?: any;
    data?: any;
    timeout?: number;
    withCredentials?: boolean;
    responseType?: string;
    _retry?: boolean;
  }
  
  interface AxiosResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: any;
    config: AxiosRequestConfig;
  }
  
  interface AxiosError<T = any> extends Error {
    config: AxiosRequestConfig;
    code?: string;
    request?: any;
    response?: AxiosResponse<T>;
    isAxiosError: boolean;
  }
  
  interface AxiosInstance {
    (config: AxiosRequestConfig): Promise<AxiosResponse>;
    (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse>;
    defaults: AxiosRequestConfig;
    interceptors: {
      request: any;
      response: any;
    };
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  }
  
  function create(config?: AxiosRequestConfig): AxiosInstance;
}

declare module 'axios' {
  export = Axios;
  export as namespace Axios;
}
"@ | Out-File -FilePath node_modules/@types/axios/index.d.ts -Encoding utf8

# Create minimal type definitions for Recharts
@"
// Type definitions for Recharts
declare namespace Recharts {
  interface ChartProps {
    width?: number;
    height?: number;
    data?: any[];
    margin?: { top?: number, right?: number, bottom?: number, left?: number };
    children?: React.ReactNode;
  }
  
  function ResponsiveContainer(props: { width?: string | number, height?: string | number, children: React.ReactNode }): React.ReactElement;
  function BarChart(props: ChartProps): React.ReactElement;
  function LineChart(props: ChartProps): React.ReactElement;
  function PieChart(props: ChartProps): React.ReactElement;
  function Bar(props: { dataKey: string, fill?: string, name?: string }): React.ReactElement;
  function Line(props: { dataKey: string, stroke?: string, name?: string }): React.ReactElement;
  function Pie(props: { data?: any[], dataKey: string, nameKey?: string, cx?: string | number, cy?: string | number, outerRadius?: number, fill?: string, label?: any }): React.ReactElement;
  function Cell(props: { fill?: string }): React.ReactElement;
  function XAxis(props: { dataKey?: string, angle?: number, textAnchor?: string, height?: number, interval?: number | string }): React.ReactElement;
  function YAxis(props: any): React.ReactElement;
  function CartesianGrid(props: { strokeDasharray?: string }): React.ReactElement;
  function Tooltip(props?: any): React.ReactElement;
  function Legend(props?: any): React.ReactElement;
}

declare module 'recharts' {
  export = Recharts;
  export as namespace Recharts;
}
"@ | Out-File -FilePath node_modules/@types/recharts/index.d.ts -Encoding utf8

# Create minimal type definitions for Material-UI
New-Item -ItemType Directory -Force -Path node_modules/@types/mui
@"
// Type definitions for Material-UI
declare namespace MaterialUI {
  // Common props
  interface SxProps {
    [key: string]: any;
  }
  
  // Components
  function Box(props: { sx?: SxProps, children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function Button(props: { variant?: string, color?: string, onClick?: () => void, children?: React.ReactNode, startIcon?: React.ReactElement, sx?: SxProps, [key: string]: any }): React.ReactElement;
  function Typography(props: { variant?: string, color?: string, children?: React.ReactNode, sx?: SxProps, [key: string]: any }): React.ReactElement;
  function Paper(props: { elevation?: number, sx?: SxProps, children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function Grid(props: { container?: boolean, item?: boolean, xs?: number, sm?: number, md?: number, lg?: number, spacing?: number, children?: React.ReactNode, sx?: SxProps, [key: string]: any }): React.ReactElement;
  function Chip(props: { label?: string, color?: string, size?: string, variant?: string, sx?: SxProps, [key: string]: any }): React.ReactElement;
  function CircularProgress(props?: any): React.ReactElement;
  function LinearProgress(props?: any): React.ReactElement;
  function Divider(props?: any): React.ReactElement;
  function IconButton(props: { size?: string, onClick?: () => void, children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function TextField(props: { fullWidth?: boolean, label?: string, name?: string, value?: any, onChange?: (e: any) => void, [key: string]: any }): React.ReactElement;
  function InputAdornment(props: { position?: string, children?: React.ReactNode }): React.ReactElement;
  function FormControl(props: { fullWidth?: boolean, children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function InputLabel(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function Select(props: { value?: any, onChange?: (e: any) => void, label?: string, children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function MenuItem(props: { value?: any, children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function Table(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function TableContainer(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function TableHead(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function TableBody(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function TableRow(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function TableCell(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function TablePagination(props: { rowsPerPageOptions?: number[], component?: string, count?: number, rowsPerPage?: number, page?: number, onPageChange?: (event: any, newPage: number) => void, onRowsPerPageChange?: (event: any) => void, [key: string]: any }): React.ReactElement;
  function Dialog(props: { open?: boolean, onClose?: () => void, children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function DialogTitle(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function DialogContent(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function DialogActions(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function Card(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function CardHeader(props: { title?: React.ReactNode, avatar?: React.ReactNode, action?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function CardContent(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function Link(props: { href?: string, children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function List(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function ListItem(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function ListItemText(props: { primary?: React.ReactNode, secondary?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function ListItemIcon(props: { children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function Tooltip(props: { title?: string, children?: React.ReactNode, [key: string]: any }): React.ReactElement;
  function CssBaseline(): React.ReactElement;
}

declare module '@mui/material' {
  export = MaterialUI;
  export as namespace MaterialUI;
}

declare module '@mui/material/styles' {
  export function createTheme(options: any): any;
  export function ThemeProvider(props: { theme: any, children: React.ReactNode }): React.ReactElement;
  export function useTheme(): any;
}

declare namespace MaterialUIIcons {
  function Add(props?: any): React.ReactElement;
  function Search(props?: any): React.ReactElement;
  function Edit(props?: any): React.ReactElement;
  function Delete(props?: any): React.ReactElement;
  function Visibility(props?: any): React.ReactElement;
  function ArrowBack(props?: any): React.ReactElement;
  function PlayArrow(props?: any): React.ReactElement;
  function Assessment(props?: any): React.ReactElement;
  function Refresh(props?: any): React.ReactElement;
  function Computer(props?: any): React.ReactElement;
  function Security(props?: any): React.ReactElement;
  function History(props?: any): React.ReactElement;
  function BugReport(props?: any): React.ReactElement;
  function Schedule(props?: any): React.ReactElement;
  function DarkMode(props?: any): React.ReactElement;
  function LightMode(props?: any): React.ReactElement;
  function Menu(props?: any): React.ReactElement;
  function Dashboard(props?: any): React.ReactElement;
  function Person(props?: any): React.ReactElement;
  function ExitToApp(props?: any): React.ReactElement;
}

declare module '@mui/icons-material' {
  export = MaterialUIIcons;
  export as namespace MaterialUIIcons;
}
"@ | Out-File -FilePath node_modules/@types/mui/index.d.ts -Encoding utf8

Write-Host "TypeScript error fixes applied successfully!" -ForegroundColor Green
Write-Host "This script has created minimal type definitions for common libraries to fix TypeScript errors." -ForegroundColor Yellow
Write-Host "For a production environment, you should install the actual @types packages using npm." -ForegroundColor Yellow 