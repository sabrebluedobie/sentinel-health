// api/nightscout/save.js
import crypto from 'crypto';

/**
 * Save data to Nightscout (glucose readings, migraines, notes)
 * POST /api/nightscout/save
 * 
 * Body formats:
 * Glucose: { kind: 'glucose', value_mgdl, time, reading_type, trend?, note? }
 * Migraine: { kind: 'migraine', start_time, end_time?, severity?, triggers?, meds_taken?, notes? }
 * Note: { kind: 'note', title?, notes, start_time? }
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const nightscoutUrl = process.env.NIGHTSCOUT_URL;
    const apiSecret = process.env.NIGHTSCOUT_API_SECRET;

    // Validate environment variables
    if (!nightscoutUrl || !apiSecret) {
      return res.status(500).json({ 
        ok: false, 
        error: 'Nightscout not configured' 
      });
    }

    // Hash the API secret
    const hashedSecret = crypto
      .createHash('sha1')
      .update(apiSecret)
      .digest('hex');

    const { kind, ...data } = req.body;

    if (!kind) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing "kind" field (glucose, migraine, or note)' 
      });
    }

    let endpoint, payload;

    switch (kind) {
      case 'glucose': {
        // Save glucose reading to /api/v1/entries
        endpoint = '/api/v1/entries';
        
        const { value_mgdl, time, reading_type, trend, note } = data;
        
        if (!value_mgdl || !time) {
          return res.status(400).json({ 
            ok: false, 
            error: 'Missing required fields: value_mgdl, time' 
          });
        }

        payload = {
          type: reading_type || 'sgv', // sgv = CGM, mbg = finger stick
          sgv: value_mgdl,
          date: new Date(time).getTime(),
          dateString: new Date(time).toISOString(),
          direction: trend || 'Flat',
          device: 'Sentrya',
          ...(note && { notes: note })
        };
        break;
      }

      case 'migraine': {
        // Save migraine as treatment to /api/v1/treatments
        endpoint = '/api/v1/treatments';
        
        const { start_time, end_time, severity, triggers, meds_taken, notes } = data;
        
        if (!start_time) {
          return res.status(400).json({ 
            ok: false, 
            error: 'Missing required field: start_time' 
          });
        }

        const duration = end_time 
          ? Math.round((new Date(end_time) - new Date(start_time)) / 60000) // minutes
          : undefined;

        let notesText = `Migraine${severity ? ` (Severity: ${severity}/10)` : ''}`;
        if (triggers) notesText += `\nTriggers: ${triggers}`;
        if (meds_taken) notesText += `\nMeds: ${meds_taken}`;
        if (notes) notesText += `\n${notes}`;

        payload = {
          eventType: 'Migraine',
          created_at: new Date(start_time).toISOString(),
          notes: notesText,
          ...(duration && { duration }),
          enteredBy: 'Sentrya'
        };
        break;
      }

      case 'note': {
        // Save general note as treatment
        endpoint = '/api/v1/treatments';
        
        const { title, notes, start_time } = data;
        
        if (!notes) {
          return res.status(400).json({ 
            ok: false, 
            error: 'Missing required field: notes' 
          });
        }

        payload = {
          eventType: 'Note',
          created_at: new Date(start_time || Date.now()).toISOString(),
          notes: title ? `${title}\n${notes}` : notes,
          enteredBy: 'Sentrya'
        };
        break;
      }

      default:
        return res.status(400).json({ 
          ok: false, 
          error: `Unknown kind: ${kind}. Use glucose, migraine, or note` 
        });
    }

    // Send to Nightscout
    const response = await fetch(`${nightscoutUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'API-SECRET': hashedSecret,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Nightscout error ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    return res.status(200).json({
      ok: true,
      message: `${kind} saved to Nightscout`,
      id: result._id || result.id
    });

  } catch (error) {
    console.error('Nightscout save error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to save to Nightscout'
    });
  }
}