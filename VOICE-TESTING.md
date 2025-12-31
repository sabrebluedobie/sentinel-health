# Voice System Testing Guide

## 🧪 Quick Test Checklist

### Basic Functionality

- [ ] **Voice toggle appears** on LogMigraine page
- [ ] **Clicking toggle** switches between keyboard ⌨️ and voice 🎤 mode
- [ ] **Microphone button** turns red and pulses when listening
- [ ] **Speaking produces transcript** in real-time (interim results)
- [ ] **Stopping microphone** finalizes the transcript
- [ ] **Notes field updates** with the transcript
- [ ] **"Read aloud" button** speaks the notes back
- [ ] **Save button** gives audio confirmation in voice mode
- [ ] **Error messages** appear calmly with dismiss option

---

## 🎯 Test Scenarios

### Scenario 1: Happy Path
```
1. Navigate to /migraine
2. Fill in date, pain level (7), duration (2 hours)
3. Click voice toggle → "🎤 Voice Mode"
4. Click microphone (turns red)
5. Say: "I have a pounding headache on the left side. It started after lunch. Bright lights make it worse."
6. Click microphone again (stops)
7. Verify transcript appears
8. Click "Read aloud" → hear it back
9. Click Save
10. Hear: "Migraine entry saved successfully. You're all set."
11. Redirected to dashboard
```

**Expected:** Smooth, hands-free logging experience.

---

### Scenario 2: Pauses & Natural Speech
```
1. Start voice mode
2. Click microphone
3. Say: "The pain is... [pause 2 seconds] ...about a six... [pause] ...maybe started at 2pm"
4. Stop microphone
```

**Expected:** All words captured despite pauses (continuous mode).

---

### Scenario 3: Corrections
```
1. Start voice mode
2. Record: "Pain level eight"
3. Stop
4. Realize you meant "seven"
5. Click reset (RotateCcw icon)
6. Record again: "Pain level seven"
```

**Expected:** Transcript clears, new recording replaces old.

---

### Scenario 4: Error - No Microphone Permission
```
1. Block microphone in browser settings
2. Try to start voice mode
3. Click microphone
```

**Expected:** 
```
⚠️ Microphone access denied. Please allow microphone permissions.
[Dismiss]
```

---

### Scenario 5: Error - No Speech Detected
```
1. Start voice mode
2. Click microphone
3. Don't speak for 5 seconds
```

**Expected:**
```
⚠️ No speech detected. Try speaking closer to the microphone.
[Dismiss]
```

---

### Scenario 6: Browser Not Supported (Firefox)
```
1. Open app in Firefox
2. Go to /migraine
3. Click voice toggle
```

**Expected:**
```
🎤 Voice input isn't available in this browser. 
Try Chrome, Edge, or Safari for voice features.
```

---

### Scenario 7: Save Error Handling
```
1. Disconnect from internet (or force a save error)
2. Use voice mode to log migraine
3. Click Save
```

**Expected:** Error message spoken aloud + visual error display.

---

## 🔊 Audio Quality Tests

### Test Different Environments

**Quiet Room:**
- Should work perfectly
- Clear transcription

**Moderate Background Noise:**
- Should still work
- May have minor errors

**Loud Background Noise:**
- May struggle
- Error message about no speech detected

**Noisy Cafe:**
- Test if app is usable in public
- Verify privacy (user comfort speaking health info)

---

## 📱 Device Testing

### Desktop
- [ ] Chrome (Windows/Mac/Linux)
- [ ] Edge (Windows/Mac)
- [ ] Safari (Mac)
- [ ] Firefox (should show "not supported")

### Mobile
- [ ] Chrome (Android)
- [ ] Safari (iOS 14.5+)
- [ ] Samsung Internet (Android)

### Permissions
- [ ] First-time microphone permission prompt appears
- [ ] Permission remembered after granting
- [ ] Graceful error if permission denied

---

## 🎭 User Personas

### Persona 1: Sarah - Chronic Migraine Sufferer
**Context:** Having a bad migraine, lights hurt, can't focus on keyboard

**Test:**
1. Open app in dim light mode (if available)
2. Use only voice mode
3. Speak slowly, with pauses
4. Use "Read aloud" to verify without reading screen

**Success:** Can complete entry without typing or reading.

---

### Persona 2: Mike - Tech-Savvy User
**Context:** Trying voice feature for first time

**Test:**
1. Toggle between keyboard and voice mode
2. Test all buttons and features
3. Read all tooltips and tips
4. Check error messages

**Success:** Feature is intuitive, self-explanatory.

---

### Persona 3: Emma - Low Energy Day
**Context:** Extreme fatigue, minimal effort available

**Test:**
1. Open app
2. Voice mode should be easily discoverable
3. Microphone button should be large and obvious
4. Minimal clicks to complete task

**Success:** Can log entry with < 5 interactions.

---

## 🐛 Known Limitations

### Expected Behaviors (Not Bugs)

1. **Interim transcript not always visible**
   - Some browsers don't show interim results
   - Final transcript still works

2. **Brief delay before first word**
   - Normal browser behavior
   - Usually < 1 second

3. **Occasional misheard words**
   - Depends on accent, pronunciation
   - User can edit transcript via keyboard mode

4. **Network required (sometimes)**
   - Chrome may need internet for some languages
   - Safari works fully offline

5. **Voice selection varies**
   - Different voices available per browser/OS
   - TTS automatically picks best available

---

## 📊 Success Metrics

Track these during testing:

- **Success Rate:** % of voice entries that save correctly
- **Error Rate:** % of sessions with errors
- **Transcript Accuracy:** % of words correctly transcribed
- **User Preference:** % who use voice vs keyboard
- **Time to Complete:** Seconds to log entry (voice vs keyboard)

---

## 🔍 Debugging Tips

### Enable Verbose Logging

The hooks already have `console.log` statements:
```
[Voice] Started listening
[Voice] Interim: "I have a"
[Voice] Final: "I have a headache"
[Voice] Stopped listening
[TTS] Started speaking
[TTS] Finished speaking
```

### Check Browser Console

Look for:
- Microphone permission status
- Speech recognition events
- TTS errors
- Voice loading status

### Inspect Network Tab

- Should see NO external API calls
- All processing is local

### Test Recognition Object

```javascript
// In browser console
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
console.log(recognition); // Should exist in supported browsers
```

### Test Synthesis Object

```javascript
// In browser console
const voices = window.speechSynthesis.getVoices();
console.log(voices.length); // Should be > 0
```

---

## 🎬 Video Test Recording

Record a screencast showing:

1. **Feature Discovery** (0:00-0:15)
   - Finding voice toggle
   - Clicking to enable

2. **Voice Input** (0:15-0:45)
   - Clicking microphone
   - Speaking naturally
   - Watching transcript appear
   - Stopping recording

3. **Playback** (0:45-1:00)
   - Clicking "Read aloud"
   - Hearing confirmation

4. **Save & Confirm** (1:00-1:15)
   - Clicking Save
   - Hearing success message
   - Redirecting to dashboard

**Target:** 1-2 minute demo showing full flow.

---

## ✅ Acceptance Criteria

### Must Have (Launch Blockers)

- ✅ Voice input works in Chrome/Safari
- ✅ TTS reads confirmations
- ✅ Errors don't crash the app
- ✅ Keyboard mode still works
- ✅ No PHI sent to external servers
- ✅ Microphone permission handling

### Should Have (Pre-Launch)

- ✅ "Read aloud" for notes
- ✅ Visual feedback when listening
- ✅ Helpful tips displayed
- ✅ Mobile responsive
- ✅ Accessibility labels

### Nice to Have (Post-Launch)

- ⭕ Multiple field voice input
- ⭕ Voice commands
- ⭕ Custom vocabulary
- ⭕ Multi-language support

---

## 🚀 Launch Checklist

Before releasing voice features:

- [ ] Test on at least 3 browsers
- [ ] Test on both desktop and mobile
- [ ] Get feedback from 3+ beta users
- [ ] Verify HIPAA compliance
- [ ] Add privacy notice
- [ ] Document in user guide
- [ ] Train support team
- [ ] Monitor error rates
- [ ] Set up usage analytics

---

## 📱 Mobile-Specific Tests

### iOS Safari

- [ ] Works in portrait mode
- [ ] Works in landscape mode
- [ ] Doesn't interfere with other audio apps
- [ ] Respects silent mode
- [ ] Handles phone calls gracefully

### Android Chrome

- [ ] Works with phone keyboard visible
- [ ] Doesn't drain battery excessively
- [ ] Handles notifications during recording
- [ ] Works with Bluetooth headset
- [ ] Permission persists across sessions

---

## 🎯 Performance Tests

### Recording Duration

- [ ] Works for < 10 seconds
- [ ] Works for 30 seconds
- [ ] Works for 1+ minute
- [ ] Handles very long recordings (2+ minutes)

### Memory Usage

- [ ] Doesn't leak memory after multiple recordings
- [ ] Can record → reset → record repeatedly
- [ ] Handles 10+ save attempts in one session

### Battery Impact (Mobile)

- [ ] Doesn't drain battery excessively
- [ ] Comparable to native voice apps
- [ ] User can record multiple entries per session

---

## 🔐 Security & Privacy Tests

- [ ] No audio files stored locally
- [ ] No audio sent to external servers
- [ ] Transcript stored securely in Supabase
- [ ] HTTPS required for microphone access
- [ ] User can delete voice-entered data
- [ ] Privacy policy mentions voice features

---

## 📝 Test Report Template

```markdown
## Voice System Test Report

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** [Browser/OS/Device]

### Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Voice toggle | ✅/❌ | |
| Microphone button | ✅/❌ | |
| Transcript accuracy | ✅/❌ | |
| Read aloud | ✅/❌ | |
| Save confirmation | ✅/❌ | |
| Error handling | ✅/❌ | |

### Issues Found

1. [Issue description]
2. [Issue description]

### User Feedback

[Quotes from test users]

### Recommendations

[Suggested improvements]
```
