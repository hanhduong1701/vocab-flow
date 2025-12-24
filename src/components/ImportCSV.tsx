import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportResult } from '@/types/vocabulary';
import { cn } from '@/lib/utils';

interface ImportCSVProps {
  onImport: (csvText: string, onDuplicate: 'skip' | 'overwrite', filename: string) => ImportResult;
  onSuccess: () => void;
}

export function ImportCSV({ onImport, onSuccess }: ImportCSVProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'overwrite'>('skip');
  const [fileName, setFileName] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setResult({
        success: 0,
        skipped: 0,
        failed: 1,
        errors: ['Please upload a CSV file'],
      });
      return;
    }

    setFileName(file.name);
    setPendingFile(file);
    setResult(null);
  };

  const handleImport = async () => {
    if (!pendingFile) return;
    
    setIsImporting(true);
    const text = await pendingFile.text();
    const importResult = onImport(text, duplicateMode, pendingFile.name);
    setResult(importResult);
    setIsImporting(false);
    
    if (importResult.success > 0) {
      // Auto redirect after short delay to show success
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const resetForm = () => {
    setFileName(null);
    setPendingFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto animate-scale-in rounded-3xl border-border/40 shadow-soft">
      <CardHeader className="relative text-center pb-2">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Import Vocabulary</CardTitle>
        <CardDescription>
          Upload a CSV file with your vocabulary words
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer",
            isDragging 
              ? "border-primary bg-primary/10" 
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInputChange}
          />
          
          <Upload className={cn(
            "h-12 w-12 mx-auto mb-4 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
          
          {fileName ? (
            <div className="space-y-2">
              <p className="font-semibold text-primary">{fileName}</p>
              <p className="text-sm text-muted-foreground">Ready to import</p>
            </div>
          ) : (
            <>
              <p className="font-medium mb-1">
                {isDragging ? "Drop your file here" : "Drag & drop your CSV file"}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
            </>
          )}
        </div>

        {/* Duplicate handling */}
        <div className="flex gap-2">
          <Button
            variant={duplicateMode === 'skip' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDuplicateMode('skip')}
            className="flex-1 rounded-full"
          >
            Skip duplicates
          </Button>
          <Button
            variant={duplicateMode === 'overwrite' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDuplicateMode('overwrite')}
            className="flex-1 rounded-full"
          >
            Overwrite duplicates
          </Button>
        </div>

        {/* Import button */}
        {pendingFile && !result && (
          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="w-full rounded-full h-12 text-base font-semibold"
            size="lg"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Import Vocabulary
              </>
            )}
          </Button>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3 animate-slide-up">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-success/20">
                <p className="text-2xl font-bold text-success-foreground">{result.success}</p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="p-3 rounded-2xl bg-warning/20">
                <p className="text-2xl font-bold text-warning-foreground">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="p-3 rounded-2xl bg-destructive/20">
                <p className="text-2xl font-bold text-destructive-foreground">{result.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive-foreground flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Errors
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
                  {result.errors.slice(0, 5).map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li className="text-muted-foreground/70">
                      ... and {result.errors.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {result.success > 0 && (
              <div className="flex items-center gap-2 text-success-foreground text-sm p-4 rounded-2xl bg-success/20">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Successfully imported {result.success} words! Redirecting...</span>
              </div>
            )}

            {result.success === 0 && (
              <Button
                variant="outline"
                onClick={resetForm}
                className="w-full rounded-full"
              >
                Try again
              </Button>
            )}
          </div>
        )}

        {/* Format help */}
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
            CSV format requirements
          </summary>
          <div className="mt-2 p-3 rounded-2xl bg-muted text-xs space-y-1">
            <p><strong>Required columns:</strong> vocabulary, Meaning_VI, Meaning_EN, Example_EN</p>
            <p><strong>Optional:</strong> Topic, Example_VI</p>
            <p className="text-muted-foreground">UTF-8 encoding recommended</p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}