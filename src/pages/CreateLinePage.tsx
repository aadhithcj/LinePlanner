import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Factory, Hash, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUploadZone } from '@/components/ui/FileUploadZone';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { useLineStore } from '@/store/useLineStore';
import { parseOBExcel } from '@/utils/obParser';
import { useToast } from '@/hooks/use-toast';
import type { Operation } from '@/types';

/**
 * Create new line page with form and file upload
 */
const CreateLinePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createLine, saveLine } = useLineStore();
  
  const [lineNo, setLineNo] = useState('');
  const [styleNo, setStyleNo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [parsedOperations, setParsedOperations] = useState<Operation[]>([]);
  
  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true);
    setUploadError(null);
    setUploadSuccess(false);
    
    try {
      const operations = await parseOBExcel(file);
      setParsedOperations(operations);
      setUploadSuccess(true);
      
      toast({
        title: "OB Sheet Parsed Successfully",
        description: `Found ${operations.length} operations across ${new Set(operations.map(o => o.section)).size} sections`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse file';
      setUploadError(message);
      
      toast({
        title: "Parsing Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const handleCreateLine = useCallback(() => {
    if (!lineNo.trim()) {
      toast({
        title: "Line No Required",
        description: "Please enter a line number",
        variant: "destructive",
      });
      return;
    }
    
    if (parsedOperations.length === 0) {
      toast({
        title: "No Operations",
        description: "Please upload an OB Excel sheet first",
        variant: "destructive",
      });
      return;
    }
    
    const line = createLine(lineNo, styleNo, parsedOperations);
    saveLine(line);
    
    toast({
      title: "Line Created Successfully",
      description: `Line ${lineNo} with ${parsedOperations.length} operations`,
    });
    
    navigate('/planner');
  }, [lineNo, styleNo, parsedOperations, createLine, saveLine, navigate, toast]);
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10 min-h-screen p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Factory className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create New Line</h1>
              <p className="text-sm text-muted-foreground">Configure your production line</p>
            </div>
          </div>
        </motion.div>
        
        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-8 space-y-8">
            {/* Line Details */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <Label htmlFor="lineNo" className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  Line Number
                </Label>
                <Input
                  id="lineNo"
                  placeholder="e.g., L-001"
                  value={lineNo}
                  onChange={(e) => setLineNo(e.target.value)}
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="styleNo" className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-muted-foreground" />
                  Style Number
                </Label>
                <Input
                  id="styleNo"
                  placeholder="e.g., PUFFIN-2023"
                  value={styleNo}
                  onChange={(e) => setStyleNo(e.target.value)}
                  className="bg-secondary/50 border-border/50 focus:border-primary"
                />
              </motion.div>
            </div>
            
            {/* File Upload */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                Upload OB Sheet
              </Label>
              <FileUploadZone
                onFileSelect={handleFileSelect}
                isLoading={isLoading}
                error={uploadError}
                success={uploadSuccess}
              />
            </div>
            
            {/* Operations Summary */}
            {uploadSuccess && parsedOperations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-xl bg-accent/10 border border-accent/30"
              >
                <h3 className="font-medium text-foreground mb-3">Parsed Operations Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Operations</p>
                    <p className="text-2xl font-bold text-foreground">{parsedOperations.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sections</p>
                    <p className="text-2xl font-bold text-foreground">
                      {new Set(parsedOperations.map(o => o.section)).size}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Machine Types</p>
                    <p className="text-2xl font-bold text-foreground">
                      {new Set(parsedOperations.map(o => o.machine_type)).size}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total SMV</p>
                    <p className="text-2xl font-bold text-foreground">
                      {parsedOperations.reduce((sum, op) => sum + op.smv, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={handleCreateLine}
                disabled={!uploadSuccess || parsedOperations.length === 0}
                className="w-full h-12 text-lg font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Generate 3D Line Layout
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateLinePage;
