import React, { useState } from 'react';
import { SubstrateDashboard } from '../components/federation/SubstrateDashboard';
import { AddPeerDialog } from '../components/federation/AddPeerDialog';
import { useFederationStore } from '../store/federationStore';
import { SubstratePeer } from '../types/federation';

export const FederationPage: React.FC = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<SubstratePeer | null>(null);

  const handlePeerSelect = (peer: SubstratePeer) => {
    setSelectedPeer(peer);
    // Could open a drawer or dialog with peer details here
  };

  const handleAddPeer = () => {
    setShowAddDialog(true);
  };

  const handleAddPeerSuccess = () => {
    // Additional success handling if needed
  };

  return (
    <>
      <SubstrateDashboard
        onPeerSelect={handlePeerSelect}
        onAddPeer={handleAddPeer}
      />
      
      <AddPeerDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={handleAddPeerSuccess}
      />
    </>
  );
};