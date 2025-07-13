# Geneva Frontend - Phase 2.1 UI Implementation

A comprehensive React-based frontend for the Geneva Platform, implementing the complete Phase 2.1 "From Isolated Intelligence to Federated Cognition" roadmap.

## 🚀 Overview

The Geneva Frontend provides a modern, interactive interface for substrate federation, ontology visualization, and topology mapping. Built with React 19, TypeScript, and Material-UI, it offers real-time updates, comprehensive analytics, and intuitive visualization tools.

## ✨ Features

### 🔗 Priority 1: Federation Core UI
- **SubstrateDashboard** - Central hub with Overview, Monitoring, and History tabs
- **Real-time Updates** - WebSocket integration for live federation events
- **Trust Management** - Visual trust level indicators and management dialogs
- **Task Delegation** - Interactive delegation interface with result tracking
- **Peer Discovery** - Automatic peer discovery and connection management
- **Federation Monitoring** - Comprehensive metrics and event logging

### 🧠 Priority 2: Ontology & Codex Visualization
- **OntologyGraphViewer** - Interactive force-directed graph visualization
- **AgentSchemaBrowser** - Browse and search agent input/output schemas
- **MemoryFieldsViewer** - Visualize agent Codex field mappings
- **CognitiveProcessingView** - Real-time processing pipeline visualization
- **OntologyDiffViewer** - Compare ontology versions side-by-side
- **ProposalSubmissionForm** - Submit and manage ontology change proposals

### 🗺️ Priority 3: Topology & Delegation Mapping
- **SubstrateTopologyGraph** - Live network topology visualization
- **DelegationFlowMap** - Timeline-based delegation flow analysis
- **InfrastructureMap** - Multi-view infrastructure monitoring
- **TopologyDashboard** - Unified dashboard with export capabilities
- **Drill-down Analysis** - Detailed views for nodes, agents, and connections

## 🛠️ Technology Stack

- **React 19** - Latest React with concurrent features
- **TypeScript 4.9** - Type-safe development
- **Material-UI 7** - Modern component library
- **React Query 5** - Efficient data fetching and caching
- **React Router 7** - Client-side routing
- **react-force-graph** - Graph visualization
- **WebSocket** - Real-time communication
- **jsPDF & XLSX** - Export functionality

## 📁 Project Structure

```
src/
├── components/
│   ├── federation/        # Federation UI components
│   ├── ontology/         # Ontology visualization components
│   ├── codex/           # Codex and memory components
│   ├── topology/        # Topology mapping components
│   └── common/          # Shared components
├── pages/               # Page-level components
├── hooks/              # Custom React hooks
├── services/           # API and WebSocket services
├── store/              # State management (Zustand)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Geneva backend running on port 8402

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Navigate to frontend directory
cd geneva-frontend

# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:8401`

### Environment Configuration
Create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:8402
REACT_APP_WS_URL=ws://localhost:8402
```

## 📝 Available Scripts

- `npm start` - Start development server on port 8401
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## 🔌 WebSocket Integration

The frontend maintains real-time connections for:
- Federation events (`/ws/federation`)
- Ontology updates (`/ws/ontology`)
- Topology changes (`/ws/topology`)

WebSocket connections include automatic reconnection, heartbeat monitoring, and error handling.

## 📊 Export Capabilities

All major visualizations support export to:
- **JSON** - Raw data export
- **CSV** - Spreadsheet compatible
- **XLSX** - Excel format with formatting
- **PDF** - Print-ready reports with charts

## 🎯 Key Components

### Federation Components
- `SubstrateDashboard` - Main federation interface
- `PeerSubstrateCard` - Individual peer display
- `FederationTopologyGraph` - Network visualization
- `TaskDelegationDialog` - Delegation interface

### Ontology Components
- `OntologyGraphViewer` - Concept graph visualization
- `AgentSchemaBrowser` - Schema exploration
- `ProposalSubmissionForm` - Change management

### Topology Components
- `SubstrateTopologyGraph` - Network topology
- `DelegationFlowMap` - Task flow analysis
- `InfrastructureMap` - Infrastructure monitoring

## 🔧 Configuration

### API Endpoints
The frontend expects the Geneva backend to provide:
- `/api/federation/*` - Federation endpoints
- `/api/ontology/*` - Ontology endpoints
- `/api/topology/*` - Topology endpoints

### State Management
Uses Zustand for state management with stores for:
- `federationStore` - Federation state and peers
- `ontologyStore` - Ontology data and schemas
- `topologyStore` - Topology and delegation data

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test SubstrateDashboard.test.tsx
```

## 🚢 Deployment

```bash
# Build for production
npm run build

# Output will be in build/ directory
# Can be served with any static file server
```

## 📚 Documentation

- Component documentation: See individual component files
- API documentation: See `/api/docs` on backend
- Architecture: See `doc/architecture.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the Geneva Platform. See the main repository for license information.

## 🙏 Acknowledgments

- Geneva Platform team for backend infrastructure
- MUI team for the excellent component library
- React team for the amazing framework