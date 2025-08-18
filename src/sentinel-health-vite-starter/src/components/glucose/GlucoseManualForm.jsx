import React, { useState } from "react";
import { GlucoseReading } from "@/entities/GlucoseReading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Loader2 } from "lucide-react";

export default function GlucoseManualForm({ onReadingAdded }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    timestamp: new Date().toISOString().slice(0, 16),
    glucose_level: "",
    reading_type: "random",
    notes: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.glucose_level) return;
    setIsSubmitting(true);
    try {
      await GlucoseReading.create({
        ...formData,
        glucose_level: parseFloat(formData.glucose_level)
      });
      setFormData({
        timestamp: new Date().toISOString().slice(0, 16),
        glucose_level: "",
        reading_type: "random",
        notes: ""
      });
      onReadingAdded && onReadingAdded();
    } catch (error) {
      console.error("Error saving glucose reading:", error);
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <Plus className="w-5 h-5 text-blue-600" />
          Add Manual Reading
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="glucose_level">Glucose (mg/dL)</Label>
              <Input
                id="glucose_level"
                type="number"
                value={formData.glucose_level}
                onChange={(e) => setFormData({ ...formData, glucose_level: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="reading_type">Reading Type</Label>
              {/* simplified select shim */}
              <select
                id="reading_type"
                value={formData.reading_type}
                onChange={(e) => setFormData({ ...formData, reading_type: e.target.value })}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="fasting">Fasting</option>
                <option value="post_meal">Post-Meal</option>
                <option value="random">Random</option>
                <option value="bedtime">Bedtime</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="timestamp">Date & Time</Label>
            <Input
              id="timestamp"
              type="datetime-local"
              value={formData.timestamp}
              onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Reading
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
