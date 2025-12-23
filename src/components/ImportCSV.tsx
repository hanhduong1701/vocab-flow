import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportResult } from '@/types/vocabulary';
import { cn } from '@/lib/utils';

interface ImportCSVProps {
  onImport: (csvText: string, onDuplicate: 'skip' | 'overwrite') => ImportResult;
  onClose?: () => void;
}

export function ImportCSV({ onImport, onClose }: ImportCSVProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'overwrite'>('skip');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
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
    const text = await file.text();
    const importResult = onImport(text, duplicateMode);
    setResult(importResult);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Card className="w-full max-w-lg mx-auto animate-scale-in">
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Import Vocabulary
        </CardTitle>
        <CardDescription>
          Upload a CSV file with your vocabulary words
        </CardDescription>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
            isDragging 
              ? "border-primary bg-primary/5" 
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
            onChange={handleFileSelect}
          />
          
          <Upload className={cn(
            "h-12 w-12 mx-auto mb-4 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
          
          <p className="font-medium mb-1">
            {isDragging ? "Drop your file here" : "Drag & drop your CSV file"}
          </p>
          <p className="text-sm text-muted-foreground">
            or click to browse
          </p>
        </div>

        {/* Duplicate handling */}
        <div className="flex gap-2">
          <Button
            variant={duplicateMode === 'skip' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDuplicateMode('skip')}
            className="flex-1"
          >
            Skip duplicates
          </Button>
          <Button
            variant={duplicateMode === 'overwrite' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDuplicateMode('overwrite')}
            className="flex-1"
          >
            Overwrite duplicates
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-3 animate-slide-up">
            {fileName && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {fileName}
              </p>
            )}
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-lg bg-success/10">
                <p className="text-2xl font-bold text-success">{result.success}</p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10">
                <p className="text-2xl font-bold text-warning">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10">
                <p className="text-2xl font-bold text-destructive">{result.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-sm font-medium text-destructive flex items-center gap-2 mb-2">
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
              <div className="flex items-center gap-2 text-success text-sm">
                <CheckCircle className="h-4 w-4" />
                Successfully imported {result.success} words!
              </div>
            )}
          </div>
        )}

        {/* Format help */}
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            CSV format requirements
          </summary>
          <div className="mt-2 p-3 rounded-lg bg-muted text-xs space-y-1">
            <p><strong>Required columns:</strong> vocabulary, Meaning_VI, Meaning_EN, Example_EN</p>
            <p><strong>Optional:</strong> Topic, Example_VI</p>
            <p className="text-muted-foreground">UTF-8 encoding recommended</p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
