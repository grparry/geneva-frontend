/**
 * AFRAME Stub Utility
 * 
 * Provides a minimal AFRAME implementation to prevent errors when
 * react-force-graph components attempt to access AFRAME globals.
 */

export const createAFrameStub = () => {
  if (typeof window !== 'undefined' && !(window as any).AFRAME) {
    (window as any).AFRAME = {
      // Core AFRAME methods that components might call
      registerComponent: () => {},
      registerGeometry: () => {},
      registerMaterial: () => {},
      registerShader: () => {},
      registerSystem: () => {},
      registerPrimitive: () => {},
      
      // AFRAME utility methods
      utils: {
        device: {
          isMobile: () => false,
          isGearVR: () => false,
          checkHeadsetConnected: () => false,
        },
        coordinates: {
          isCoordinate: () => false,
          parse: () => ({ x: 0, y: 0, z: 0 }),
          stringify: () => '0 0 0',
        },
        entity: {
          getComponentProperty: () => null,
          setComponentProperty: () => {},
        },
        styleParser: {
          parse: () => ({}),
        },
      },
      
      // Scene and entity references
      scenes: [],
      
      // Version info
      version: '1.0.0-stub',
      
      // Empty objects for compatibility
      components: {},
      geometries: {},
      materials: {},
      shaders: {},
      systems: {},
      primitives: {},
      
      // Three.js stub (sometimes needed)
      THREE: typeof window !== 'undefined' && (window as any).THREE || {}
    };
    
    console.log('Created AFRAME stub to prevent react-force-graph errors');
  }
};

/**
 * Safe dynamic import for react-force-graph components
 */
export const safeForceGraphImport = async () => {
  try {
    // Create AFRAME stub before importing
    createAFrameStub();
    
    // Import react-force-graph
    const module = await import('react-force-graph');
    return module;
  } catch (error) {
    console.error('Failed to load react-force-graph:', error);
    throw error;
  }
};