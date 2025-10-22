'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateOrganizationModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateOrganizationModal({ open, onClose }: CreateOrganizationModalProps) {
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  async function handleCreate() {
    if (!orgName.trim()) {
      setError('Organization name is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/organization/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationName: orgName.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Organization Created',
          description: 'Redirecting to business verification...'
        });
        
        // Immediately redirect to business KYB
        window.location.href = data.kybLink;
      } else {
        setError(data.error || 'Failed to create organization');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Organization
          </DialogTitle>
          <DialogDescription>
            Create a new organization with multi-sig treasury. 
            You'll verify your business identity next.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              placeholder="Acme Corporation" 
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && orgName.trim() && !loading) {
                  handleCreate();
                }
              }}
            />
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              After creation, you'll complete business verification (EIN, incorporation documents) 
              to activate your treasury account.
            </AlertDescription>
          </Alert>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!orgName.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create & Verify Business'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
