import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Avatar,
  AvatarGroup,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Badge,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Search as SearchIcon,
  FindReplace as ReplaceIcon,
  Settings as SettingsIcon,
  Share as ShareIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Add as AddIcon,
  FolderOpen as OpenIcon,
  FileCopy as CopyIcon,
  Download as DownloadIcon,
  BugReport as DebugIcon,
  PlayArrow as RunIcon,
  Stop as StopIcon,
  Visibility as PreviewIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import {
  CodeEditorSession,
  CodeFile,
  Collaborator,
  EditorCursor,
  EditorSelection
} from '../../../types/geneva-tools';

interface CollaborativeEditorProps {
  sessionId?: string;
  initialFiles?: CodeFile[];
  collaborators?: Collaborator[];
  onFileChange?: (fileId: string, content: string) => void;
  onFileSave?: (fileId: string, content: string) => void;
  onCollaboratorJoin?: (collaborator: Collaborator) => void;
  onCursorMove?: (fileId: string, cursor: EditorCursor) => void;
  onSelectionChange?: (fileId: string, selection: EditorSelection) => void;
  readOnly?: boolean;
  height?: number;
  showCollaborators?: boolean;
  showMinimap?: boolean;
  theme?: 'vs-light' | 'vs-dark';
}

const LANGUAGE_EXTENSIONS = {
  typescript: '.ts',
  javascript: '.js',
  python: '.py',
  java: '.java',
  cpp: '.cpp',
  html: '.html',
  css: '.css',
  json: '.json',
  yaml: '.yaml',
  markdown: '.md'
};

const COLLABORATOR_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
];

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  sessionId = 'default-session',
  initialFiles = [],
  collaborators = [],
  onFileChange,
  onFileSave,
  onCollaboratorJoin,
  onCursorMove,
  onSelectionChange,
  readOnly = false,
  height = 600,
  showCollaborators = true,
  showMinimap = true,
  theme = 'vs-light'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLanguage, setNewFileLanguage] = useState('typescript');
  const [cursors, setCursors] = useState<Map<string, EditorCursor[]>>(new Map());
  const [selections, setSelections] = useState<Map<string, EditorSelection[]>>(new Map());

  // Mock data for demonstration
  const mockFiles: CodeFile[] = initialFiles.length > 0 ? initialFiles : [
    {
      id: 'file-1',
      name: 'App.tsx',
      path: '/src/App.tsx',
      content: `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from './theme';
import { ACORNChatRoom } from './components/chat/ACORNChatRoom';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<ACORNChatRoom />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;`,
      language: 'typescript',
      isModified: false,
      cursors: [],
      selections: [],
      breakpoints: [15],
      lastModified: new Date().toISOString()
    },
    {
      id: 'file-2',
      name: 'utils.ts',
      path: '/src/utils.ts',
      content: `export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString();
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};`,
      language: 'typescript',
      isModified: true,
      cursors: [],
      selections: [],
      breakpoints: [],
      lastModified: new Date(Date.now() - 5000).toISOString()
    },
    {
      id: 'file-3',
      name: 'README.md',
      path: '/README.md',
      content: `# Geneva Frontend

This is the frontend application for the Geneva project, featuring:

## Features

- **Real-time Collaboration**: Multiple developers can work on the same files simultaneously
- **Advanced Code Editing**: Monaco editor with IntelliSense, syntax highlighting, and error detection
- **Integrated Debugging**: Set breakpoints and debug code directly in the editor
- **Live Preview**: See changes in real-time with hot reloading

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## Architecture

The application uses:
- React 18 with TypeScript
- Material-UI for component library
- Monaco Editor for code editing
- WebSocket for real-time collaboration
`,
      language: 'markdown',
      isModified: false,
      cursors: [],
      selections: [],
      breakpoints: [],
      lastModified: new Date(Date.now() - 30000).toISOString()
    }
  ];

  const mockCollaborators: Collaborator[] = collaborators.length > 0 ? collaborators : [
    {
      id: 'user-1',
      name: 'Alice Johnson',
      color: COLLABORATOR_COLORS[0],
      isActive: true,
      currentFile: 'file-1',
      cursorPosition: { line: 8, column: 25 }
    },
    {
      id: 'user-2', 
      name: 'Bob Smith',
      color: COLLABORATOR_COLORS[1],
      isActive: true,
      currentFile: 'file-2',
      cursorPosition: { line: 12, column: 15 }
    },
    {
      id: 'user-3',
      name: 'Charlie Brown',
      color: COLLABORATOR_COLORS[2],
      isActive: false,
      currentFile: undefined,
      cursorPosition: undefined
    }
  ];

  const effectiveFiles = files.length > 0 ? files : mockFiles;
  const effectiveCollaborators = collaborators.length > 0 ? collaborators : mockCollaborators;

  useEffect(() => {
    setFiles(mockFiles);
    if (mockFiles.length > 0) {
      setActiveFileId(mockFiles[0].id);
    }
  }, []);

  // Simulate Monaco Editor loading
  useEffect(() => {
    if (editorRef.current && !monacoRef.current) {
      // In a real implementation, this would load the Monaco editor
      const mockEditor = {
        getValue: () => activeFileId ? effectiveFiles.find(f => f.id === activeFileId)?.content || '' : '',
        setValue: (value: string) => {
          if (activeFileId) {
            handleFileContentChange(activeFileId, value);
          }
        },
        getModel: () => ({
          onDidChangeContent: (callback: any) => {
            // Mock content change listener
          }
        }),
        addCommand: (keybinding: any, handler: any) => {
          // Mock command registration
        },
        focus: () => {
          // Mock focus
        }
      };
      
      monacoRef.current = mockEditor;
    }
  }, [activeFileId, effectiveFiles]);

  const handleFileContentChange = useCallback((fileId: string, content: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, content, isModified: true, lastModified: new Date().toISOString() }
        : file
    ));
    onFileChange?.(fileId, content);
  }, [onFileChange]);

  const handleFileSave = useCallback((fileId: string) => {
    const file = effectiveFiles.find(f => f.id === fileId);
    if (file) {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, isModified: false } : f
      ));
      onFileSave?.(fileId, file.content);
    }
  }, [effectiveFiles, onFileSave]);

  const handleNewFile = () => {
    if (newFileName.trim()) {
      const extension = LANGUAGE_EXTENSIONS[newFileLanguage as keyof typeof LANGUAGE_EXTENSIONS] || '.txt';
      const fileName = newFileName.endsWith(extension) ? newFileName : newFileName + extension;
      
      const newFile: CodeFile = {
        id: `file-${Date.now()}`,
        name: fileName,
        path: `/${fileName}`,
        content: '',
        language: newFileLanguage,
        isModified: false,
        cursors: [],
        selections: [],
        breakpoints: [],
        lastModified: new Date().toISOString()
      };
      
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
      setShowNewFileDialog(false);
      setNewFileName('');
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    // Simulate code execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRunning(false);
  };

  const handleSearch = () => {
    // Implement search functionality
    console.log('Searching for:', searchValue);
  };

  const handleReplace = () => {
    // Implement replace functionality  
    console.log('Replacing:', searchValue, 'with:', replaceValue);
  };

  const activeFile = effectiveFiles.find(f => f.id === activeFileId);
  const activeCollaborators = effectiveCollaborators.filter(c => c.isActive);
  const fileCollaborators = effectiveCollaborators.filter(c => c.currentFile === activeFileId);

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height }}>
      {/* Top Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">
            Collaborative Editor
          </Typography>
          {sessionId && (
            <Chip label={`Session: ${sessionId}`} size="small" variant="outlined" />
          )}
        </Stack>
        
        <Stack direction="row" spacing={1}>
          {showCollaborators && (
            <AvatarGroup max={4} sx={{ mr: 2 }}>
              {activeCollaborators.map(collaborator => (
                <Tooltip key={collaborator.id} title={collaborator.name}>
                  <Avatar 
                    sx={{ 
                      bgcolor: collaborator.color, 
                      width: 32, 
                      height: 32,
                      fontSize: '0.875rem'
                    }}
                  >
                    {collaborator.name.charAt(0)}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          )}
          
          <Tooltip title="New File">
            <IconButton onClick={() => setShowNewFileDialog(true)}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Save">
            <IconButton 
              onClick={() => activeFileId && handleFileSave(activeFileId)}
              disabled={!activeFile?.isModified}
            >
              <SaveIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Search">
            <IconButton onClick={() => setShowSearch(!showSearch)}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Run Code">
            <IconButton 
              onClick={handleRunCode}
              disabled={isRunning}
              color={isRunning ? 'primary' : 'default'}
            >
              {isRunning ? <StopIcon /> : <RunIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Settings">
            <IconButton onClick={(e) => setSettingsAnchor(e.currentTarget)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            <IconButton onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Search Bar */}
      {showSearch && (
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              label="Search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <TextField
              size="small"
              label="Replace"
              value={replaceValue}
              onChange={(e) => setReplaceValue(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <Button variant="outlined" size="small" onClick={handleSearch}>
              Find
            </Button>
            <Button variant="outlined" size="small" onClick={handleReplace}>
              Replace
            </Button>
          </Stack>
        </Box>
      )}

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* File Tabs */}
        <Box sx={{ width: 250, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2">Files</Typography>
          </Box>
          
          <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
            {effectiveFiles.map(file => (
              <ListItem
                key={file.id}
                component="div"
                sx={{ 
                  py: 0.5,
                  cursor: 'pointer',
                  backgroundColor: activeFileId === file.id ? 'action.selected' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={() => setActiveFileId(file.id)}
              >
                <ListItemIcon>
                  <CodeIcon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {file.name}
                      </Typography>
                      {file.isModified && (
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {file.language}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  {fileCollaborators.length > 0 && (
                    <Badge badgeContent={fileCollaborators.length} color="primary">
                      <PersonIcon sx={{ fontSize: 16 }} />
                    </Badge>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Editor Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeFile && (
            <>
              {/* File Header */}
              <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2">
                      {activeFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activeFile.path} • {activeFile.language}
                    </Typography>
                  </Box>
                  
                  <Stack direction="row" spacing={1}>
                    {activeFile.breakpoints.length > 0 && (
                      <Chip 
                        label={`${activeFile.breakpoints.length} breakpoints`}
                        size="small"
                        color="secondary"
                        icon={<DebugIcon />}
                      />
                    )}
                    <Chip 
                      label={activeFile.isModified ? 'Modified' : 'Saved'}
                      size="small"
                      color={activeFile.isModified ? 'warning' : 'success'}
                    />
                  </Stack>
                </Box>
              </Box>

              {/* Collaborators in this file */}
              {fileCollaborators.length > 0 && (
                <Box sx={{ p: 1, bgcolor: 'info.light', color: 'info.contrastText' }}>
                  <Typography variant="caption">
                    Currently editing: {fileCollaborators.map(c => c.name).join(', ')}
                  </Typography>
                </Box>
              )}

              {/* Mock Editor */}
              <Box 
                ref={editorRef}
                sx={{ 
                  flex: 1, 
                  bgcolor: theme === 'vs-dark' ? '#1e1e1e' : '#ffffff',
                  color: theme === 'vs-dark' ? '#d4d4d4' : '#000000',
                  fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
                  fontSize: '14px',
                  lineHeight: 1.4,
                  p: 2,
                  overflow: 'auto',
                  position: 'relative'
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {activeFile.content}
                </pre>
                
                {/* Simulated cursor indicators for collaborators */}
                {fileCollaborators.map(collaborator => (
                  collaborator.cursorPosition && (
                    <Box
                      key={collaborator.id}
                      sx={{
                        position: 'absolute',
                        left: collaborator.cursorPosition.column * 8.4 + 16, // Approximate character width
                        top: collaborator.cursorPosition.line * 19.6 + 16, // Approximate line height
                        width: 2,
                        height: 20,
                        bgcolor: collaborator.color,
                        pointerEvents: 'none',
                        '&::after': {
                          content: `"${collaborator.name}"`,
                          position: 'absolute',
                          top: -25,
                          left: 0,
                          bgcolor: collaborator.color,
                          color: 'white',
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 0.5,
                          fontSize: '11px',
                          whiteSpace: 'nowrap'
                        }
                      }}
                    />
                  )
                ))}
              </Box>
            </>
          )}
          
          {!activeFile && (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Select a file to start editing
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Status Bar */}
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.100' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2}>
            <Typography variant="caption">
              {effectiveFiles.length} files
            </Typography>
            {activeFile && (
              <Typography variant="caption">
                Language: {activeFile.language}
              </Typography>
            )}
            <Typography variant="caption">
              {activeCollaborators.length} collaborators online
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            {isRunning && (
              <Chip label="Running..." size="small" color="primary" />
            )}
            <Typography variant="caption">
              Session: {sessionId}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchor}
        open={Boolean(settingsAnchor)}
        onClose={() => setSettingsAnchor(null)}
      >
        <MenuItem onClick={() => setSettingsAnchor(null)}>
          Toggle Theme
        </MenuItem>
        <MenuItem onClick={() => setSettingsAnchor(null)}>
          Toggle Minimap
        </MenuItem>
        <MenuItem onClick={() => setSettingsAnchor(null)}>
          Font Settings
        </MenuItem>
        <MenuItem onClick={() => setSettingsAnchor(null)}>
          Collaboration Settings
        </MenuItem>
      </Menu>

      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onClose={() => setShowNewFileDialog(false)}>
        <DialogTitle>Create New File</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
            <TextField
              fullWidth
              label="File Name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="Enter file name..."
            />
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={newFileLanguage}
                label="Language"
                onChange={(e) => setNewFileLanguage(e.target.value)}
              >
                <MenuItem value="typescript">TypeScript</MenuItem>
                <MenuItem value="javascript">JavaScript</MenuItem>
                <MenuItem value="python">Python</MenuItem>
                <MenuItem value="java">Java</MenuItem>
                <MenuItem value="cpp">C++</MenuItem>
                <MenuItem value="html">HTML</MenuItem>
                <MenuItem value="css">CSS</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="yaml">YAML</MenuItem>
                <MenuItem value="markdown">Markdown</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewFileDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleNewFile}
            variant="contained"
            disabled={!newFileName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};