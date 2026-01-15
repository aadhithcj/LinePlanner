import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Trash2, Eye, Factory, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { useLineStore } from '@/store/useLineStore';
import { format } from 'date-fns';

/**
 * View saved lines page with animated card list
 */
const ViewLinesPage = () => {
  const navigate = useNavigate();
  const { savedLines, loadLine, deleteLine } = useLineStore();
  
  const handleLoadLine = (id: string) => {
    loadLine(id);
    navigate('/planner');
  };
  
  const handleDeleteLine = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteLine(id);
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100,
      },
    },
    exit: {
      opacity: 0,
      x: -100,
      transition: { duration: 0.3 },
    },
  };
  
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
            <div className="p-2 rounded-xl bg-accent/10">
              <FolderOpen className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Saved Lines</h1>
              <p className="text-sm text-muted-foreground">
                {savedLines.length} {savedLines.length === 1 ? 'line' : 'lines'} saved
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Lines Grid */}
        {savedLines.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center py-20"
          >
            <div className="p-6 rounded-2xl bg-secondary/30 inline-block mb-6">
              <Factory className="w-16 h-16 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No Saved Lines</h2>
            <p className="text-muted-foreground mb-6">
              Create your first production line to see it here
            </p>
            <Button onClick={() => navigate('/create')}>
              Create New Line
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            <AnimatePresence mode="popLayout">
              {savedLines.map((line) => (
                <motion.div
                  key={line.id}
                  variants={itemVariants}
                  exit="exit"
                  layout
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLoadLine(line.id)}
                  className="group cursor-pointer"
                >
                  <div className="relative glass-card rounded-2xl p-6 h-full overflow-hidden">
                    {/* Background gradient */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground">Line {line.lineNo}</h3>
                          {line.styleNo && (
                            <p className="text-sm text-muted-foreground mt-1">{line.styleNo}</p>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteLine(e, line.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-secondary/50">
                          <p className="text-xs text-muted-foreground">Operations</p>
                          <p className="text-lg font-semibold text-foreground">{line.operations.length}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/50">
                          <p className="text-xs text-muted-foreground">Total SMV</p>
                          <p className="text-lg font-semibold text-foreground">{line.totalSMV.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(line.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                      
                      {/* View indicator */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ViewLinesPage;
