import React, { useState } from "react";
import { UploadFile, ExtractDataFromUploadedFile } from "@/integrations/Core";
import { GlucoseReading } from "@/entities/GlucoseReading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// TODO: Add back alert component - temporarily commented for deployment
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Loader2, FileCheck2, AlertCircle } from "lucide-react";

export default function GlucoseImport({ onImportSuccess }) {
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState(null);
  const [successCount, setSuccessCount] = useState(0);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setSuccessCount(0);
    setFileName(file.name);

    try {
      // NOTE: placeholder since integrations/Core isn't present in this scaffold
      const text = await file.text();
      const rows = text.split(/\r?\n/).slice(1).filter(Boolean);
      const readingsToCreate = rows.map((line)=>{
        const [ts, level] = line.split(','); // naive CSV
        return { timestamp: new Date(ts).toISOString(), glucose_level: Number(level), reading_type: 'random' };
      });
      await GlucoseReading.bulkCreate(readingsToCreate);
      setSuccessCount(readingsToCreate.length);
      onImportSuccess && onImportSuccess();
    } catch (e) {
      console.error("Import failed:", e);
      setError(e.message || "An unexpected error occurred during import.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Upload className="w-5 h-5 text-green-600" />
          Import CGM Data
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mt-4">
          <Button asChild variant="outline" className="w-full">
            <label htmlFor="cgm-import-file" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importing..." : "Choose CSV File"}
            </label>
          </Button>
          <input
            id="cgm-import-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            disabled={isImporting}
          />
        </div>
        {isImporting && (
          <div className="flex items-center justify-center gap-2 mt-4 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p>Processing "{fileName}"...</p>
          </div>
        )}
        {error && (
          <div className="mt-4 text-sm text-red-600">
            Import Failed: {error}
          </div>
        )}
        {successCount > 0 && (
          <div className="mt-4 text-sm text-green-700">
            Successfully imported {successCount} new glucose readings.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
