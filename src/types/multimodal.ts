// Multi-modal types for Claude Code integration

export enum MediaType {
  IMAGE = 'IMAGE',
  DIAGRAM = 'DIAGRAM',
  API_SPEC = 'API_SPEC',
  DOCUMENT = 'DOCUMENT',
  CODE_SNIPPET = 'CODE_SNIPPET'
}

export enum DiagramType {
  MERMAID = 'mermaid',
  PLANTUML = 'plantuml',
  GRAPHVIZ = 'graphviz',
  DRAWIO = 'drawio'
}

export interface MediaItem {
  id: string;
  type: MediaType;
  title?: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ImageMedia extends MediaItem {
  type: MediaType.IMAGE;
  data: string; // Base64 or URL
  mimeType: string;
  width?: number;
  height?: number;
  thumbnailData?: string;
}

export interface DiagramMedia extends MediaItem {
  type: MediaType.DIAGRAM;
  source: string; // Diagram source code
  diagramType: DiagramType;
  renderedSvg?: string; // Pre-rendered SVG if available
}

export interface APISpecMedia extends MediaItem {
  type: MediaType.API_SPEC;
  content: string; // JSON or YAML content
  format: 'openapi' | 'swagger' | 'asyncapi' | 'graphql';
  version?: string;
}

export interface DocumentMedia extends MediaItem {
  type: MediaType.DOCUMENT;
  content: string;
  format: 'markdown' | 'text' | 'html' | 'pdf';
  mimeType?: string;
}

export interface CodeSnippetMedia extends MediaItem {
  type: MediaType.CODE_SNIPPET;
  code: string;
  language: string;
  filename?: string;
  startLine?: number;
  endLine?: number;
  highlighted?: boolean;
}

export type AnyMediaItem = ImageMedia | DiagramMedia | APISpecMedia | DocumentMedia | CodeSnippetMedia;

export interface MultiModalContext {
  id: string;
  taskId?: string;
  sessionId?: string;
  mediaItems: AnyMediaItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaUploadResult {
  success: boolean;
  mediaId?: string;
  error?: string;
  media?: AnyMediaItem;
}