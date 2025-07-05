import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Stack,
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  Image as ImageIcon,
  AccountTree as DiagramIcon,
  Api as ApiIcon,
  Description as DocumentIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { MultiModalViewer } from './MultiModalViewer';
import { MediaUpload } from './MediaUpload';
import {
  AnyMediaItem,
  MediaType,
  DiagramType,
  ImageMedia,
  DiagramMedia,
  CodeSnippetMedia,
  DocumentMedia,
  APISpecMedia,
  MultiModalContext
} from '../../../types/multimodal';

export const MultiModalDemo: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [demoContext, setDemoContext] = useState<MultiModalContext | null>(null);
  const [customMedia, setCustomMedia] = useState<AnyMediaItem[]>([]);

  const createDemoContext = (type: MediaType): MultiModalContext => {
    const now = new Date().toISOString();
    let mediaItems: AnyMediaItem[] = [];

    switch (type) {
      case MediaType.IMAGE:
        const imageMedia: ImageMedia = {
          id: 'demo-image-1',
          type: MediaType.IMAGE,
          title: 'Error Screenshot',
          description: 'Authentication error in browser console',
          data: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#f8f9fa"/>
              <rect x="20" y="20" width="360" height="260" fill="white" stroke="#dee2e6" rx="5"/>
              <rect x="30" y="30" width="340" height="40" fill="#dc3545"/>
              <text x="200" y="55" text-anchor="middle" fill="white" font-family="Arial" font-size="16">
                Authentication Error
              </text>
              <text x="40" y="100" fill="#333" font-family="Arial" font-size="12">
                Error: JWT token validation failed
              </text>
              <text x="40" y="120" fill="#666" font-family="Arial" font-size="10">
                at validateToken (auth.js:42)
              </text>
              <text x="40" y="140" fill="#666" font-family="Arial" font-size="10">
                at middleware (app.js:15)
              </text>
              <rect x="40" y="160" width="320" height="100" fill="#f8f9fa" stroke="#dee2e6"/>
              <text x="50" y="180" fill="#333" font-family="monospace" font-size="10">
                Request Headers:
              </text>
              <text x="50" y="200" fill="#666" font-family="monospace" font-size="9">
                Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
              </text>
              <text x="50" y="220" fill="#666" font-family="monospace" font-size="9">
                Content-Type: application/json
              </text>
              <text x="50" y="240" fill="#dc3545" font-family="monospace" font-size="9">
                Status: 401 Unauthorized
              </text>
            </svg>
          `),
          mimeType: 'image/svg+xml',
          width: 400,
          height: 300,
          timestamp: now
        };
        mediaItems = [imageMedia];
        break;

      case MediaType.DIAGRAM:
        const diagramMedia: DiagramMedia = {
          id: 'demo-diagram-1',
          type: MediaType.DIAGRAM,
          title: 'Authentication Flow',
          description: 'Current authentication architecture with JWT tokens',
          source: `graph TB
            Client[Web Client]
            API[API Gateway]
            Auth[Auth Service]
            DB[(Database)]
            
            Client -->|1. Login Request| API
            API -->|2. Validate Credentials| Auth
            Auth -->|3. Check User| DB
            DB -->|4. User Data| Auth
            Auth -->|5. Generate JWT| API
            API -->|6. Return Token| Client
            
            Client -->|7. API Request + JWT| API
            API -->|8. Validate Token| Auth
            Auth -->|9. Token Valid| API
            API -->|10. Response| Client`,
          diagramType: DiagramType.MERMAID,
          timestamp: now
        };
        mediaItems = [diagramMedia];
        break;

      case MediaType.CODE_SNIPPET:
        const codeMedia: CodeSnippetMedia = {
          id: 'demo-code-1',
          type: MediaType.CODE_SNIPPET,
          title: 'JWT Validation Function',
          description: 'The function that is failing to validate tokens',
          code: `async function validateToken(token) {
  try {
    // Decode JWT header to get algorithm
    const header = JSON.parse(
      Buffer.from(token.split('.')[0], 'base64').toString()
    );
    
    if (header.alg !== 'HS256') {
      throw new Error('Invalid algorithm');
    }
    
    // Verify signature with secret
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is expired
    if (verified.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    return verified;
  } catch (error) {
    console.error('Token validation failed:', error.message);
    throw new Error('Invalid token');
  }
}`,
          language: 'javascript',
          filename: 'auth.js',
          startLine: 35,
          endLine: 55,
          highlighted: true,
          timestamp: now
        };
        mediaItems = [codeMedia];
        break;

      case MediaType.API_SPEC:
        const apiMedia: APISpecMedia = {
          id: 'demo-api-1',
          type: MediaType.API_SPEC,
          title: 'Authentication API',
          description: 'OpenAPI specification for authentication endpoints',
          content: JSON.stringify({
            openapi: '3.0.0',
            info: {
              title: 'Authentication API',
              version: '2.0.0',
              description: 'JWT-based authentication service'
            },
            servers: [
              { url: 'https://api.example.com/v2' }
            ],
            paths: {
              '/auth/login': {
                post: {
                  summary: 'User authentication',
                  description: 'Authenticate user and return JWT token',
                  requestBody: {
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: {
                            username: { type: 'string' },
                            password: { type: 'string' }
                          },
                          required: ['username', 'password']
                        }
                      }
                    }
                  },
                  responses: {
                    '200': {
                      description: 'Authentication successful',
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            properties: {
                              token: { type: 'string' },
                              expires_in: { type: 'integer' }
                            }
                          }
                        }
                      }
                    },
                    '401': {
                      description: 'Invalid credentials'
                    }
                  }
                }
              },
              '/auth/validate': {
                post: {
                  summary: 'Token validation',
                  description: 'Validate JWT token',
                  security: [
                    { bearerAuth: [] }
                  ],
                  responses: {
                    '200': {
                      description: 'Token is valid'
                    },
                    '401': {
                      description: 'Invalid or expired token'
                    }
                  }
                }
              }
            },
            components: {
              securitySchemes: {
                bearerAuth: {
                  type: 'http',
                  scheme: 'bearer',
                  bearerFormat: 'JWT'
                }
              }
            }
          }, null, 2),
          format: 'openapi',
          version: '3.0.0',
          timestamp: now
        };
        mediaItems = [apiMedia];
        break;

      case MediaType.DOCUMENT:
        const docMedia: DocumentMedia = {
          id: 'demo-doc-1',
          type: MediaType.DOCUMENT,
          title: 'Authentication Troubleshooting Guide',
          description: 'Step-by-step guide to debug JWT authentication issues',
          content: `# Authentication Troubleshooting Guide

## Problem Description
Users are experiencing 401 Unauthorized errors when accessing protected endpoints.

## Symptoms
- JWT token validation fails intermittently
- Error occurs after ~1 hour of usage
- Affects both web and mobile clients

## Investigation Steps

### 1. Check Token Format
\`\`\`bash
# Decode JWT header
echo "eyJ0eXAiOiJKV1QiLCJhbGc..." | base64 -d
\`\`\`

### 2. Verify Secret Configuration
- Check \`JWT_SECRET\` environment variable
- Ensure secret is not rotated mid-session
- Validate secret length (minimum 256 bits)

### 3. Review Token Expiration
- Default expiration: 1 hour
- Check if refresh token flow is implemented
- Validate server/client time synchronization

## Root Cause
Token expiration time mismatch between server and client.

## Solution
1. Implement automatic token refresh
2. Add grace period for clock skew
3. Update client error handling

## Prevention
- Add monitoring for authentication failures
- Implement token expiration warnings
- Set up alerts for high 401 error rates`,
          format: 'markdown',
          timestamp: now
        };
        mediaItems = [docMedia];
        break;

      default:
        mediaItems = [];
    }

    return {
      id: `demo-context-${type}`,
      mediaItems,
      createdAt: now,
      updatedAt: now
    };
  };

  const showDemo = (type: MediaType) => {
    const context = createDemoContext(type);
    setDemoContext(context);
  };

  const handleCustomMediaAdded = (media: AnyMediaItem[]) => {
    setCustomMedia(prev => [...prev, ...media]);
  };

  const createCustomContext = (): MultiModalContext => {
    const now = new Date().toISOString();
    return {
      id: 'custom-context',
      mediaItems: customMedia,
      createdAt: now,
      updatedAt: now
    };
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto', my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Multi-Modal Context Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This demo showcases the multi-modal context system that allows Claude to work with
        screenshots, diagrams, code, API specs, and documents in chat conversations.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab label="Demo Content" />
          <Tab label="Custom Upload" />
        </Tabs>
      </Box>

      {selectedTab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Try Different Media Types
          </Typography>
          
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              onClick={() => showDemo(MediaType.IMAGE)}
            >
              Screenshot
            </Button>
            <Button
              variant="outlined"
              startIcon={<DiagramIcon />}
              onClick={() => showDemo(MediaType.DIAGRAM)}
            >
              Architecture Diagram
            </Button>
            <Button
              variant="outlined"
              startIcon={<CodeIcon />}
              onClick={() => showDemo(MediaType.CODE_SNIPPET)}
            >
              Code Snippet
            </Button>
            <Button
              variant="outlined"
              startIcon={<ApiIcon />}
              onClick={() => showDemo(MediaType.API_SPEC)}
            >
              API Specification
            </Button>
            <Button
              variant="outlined"
              startIcon={<DocumentIcon />}
              onClick={() => showDemo(MediaType.DOCUMENT)}
            >
              Documentation
            </Button>
          </Stack>

          {demoContext && (
            <MultiModalViewer
              context={demoContext}
              embedded
              maxHeight={500}
            />
          )}

          {!demoContext && (
            <Alert severity="info">
              Click a button above to see different types of media content
            </Alert>
          )}
        </Box>
      )}

      {selectedTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Upload Your Own Content
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <MediaUpload
              onMediaAdded={handleCustomMediaAdded}
              multiple
            />
          </Box>

          {customMedia.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Your Uploaded Content ({customMedia.length} items):
              </Typography>
              <MultiModalViewer
                context={createCustomContext()}
                embedded
                maxHeight={500}
              />
            </Box>
          )}

          {customMedia.length === 0 && (
            <Alert severity="info">
              Upload images, drag & drop files, or paste screenshots to see them displayed here.
              You can also manually add diagrams, code snippets, and API specifications.
            </Alert>
          )}
        </Box>
      )}

      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Usage in Chat:
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Click the <strong>+</strong> button in any ACORN chat to add media<br/>
          • Paste screenshots directly into the chat<br/>
          • Drag & drop files onto the upload area<br/>
          • Messages with media will display rich content inline<br/>
          • Claude can analyze and respond to visual content
        </Typography>
      </Box>
    </Paper>
  );
};