# QuickStartGuide Component

## Overview
Interactive 5-step wizard that appears after users complete the onboarding module selection. Provides personalized guidance based on which health tracking modules they've enabled.

## Usage

```jsx
import QuickStartGuide from "@/components/QuickStartGuide";

function YourComponent() {
  const [showGuide, setShowGuide] = useState(false);
  
  return (
    <>
      {showGuide && (
        <QuickStartGuide 
          moduleProfile={userProfile} 
          onDismiss={() => setShowGuide(false)} 
        />
      )}
    </>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `moduleProfile` | Object | Yes | User's module profile with `enabled_modules` and `module_options` |
| `onDismiss` | Function | Yes | Callback when user closes the guide or clicks "Get Started!" |

## Features

### 1. **Personalized Content**
- Dynamically adjusts based on enabled modules
- Shows only relevant tracking information
- Tailors examples to user's specific setup

### 2. **5-Step Wizard**
1. **Welcome** - Sets expectations with Week 1 goal + hero image
2. **What You're Tracking** - Lists enabled modules with color-coded cards
3. **How to Log** - Step-by-step guide with numbered instructions
4. **Understanding Insights** - Explains charts, correlations, sample sizes
5. **Pro Tips** - Best practices for successful tracking

### 3. **Navigation**
- Previous/Next buttons
- Progress dots (clickable to jump between steps)
- Disabled Previous on first step
- "Get Started!" CTA on final step

### 4. **Visual Design**
- Modal overlay (fixed, centered)
- Gradient header from blue-50 to purple-50
- Icons for each step (from lucide-react)
- Color-coded module cards matching dashboard
- Responsive max-width of 2xl (672px)
- Max height 90vh with scrollable content

## Step Breakdown

### Step 1: Welcome 🎉
```jsx
- Hero image: /assets/mobile-friendly_1.webp
- Goal: Log 7+ days for patterns
- Icon: Target
```

### Step 2: What You're Tracking ✓
```jsx
- Migraine: Red card
- Sleep: Blue card  
- Glucose: Purple card
- Pain: Orange card
- Shows CGM vs Manual for glucose
- Icon: CheckCircle
```

### Step 3: How to Log 📅
```jsx
1. Find Quick Actions (blue gradient)
2. Fill in Form (purple gradient)
3. Submit & View (green gradient)
- Icon: Calendar
```

### Step 4: Understanding Insights 📈
```jsx
- Trend Charts explanation
- Correlations (if applicable modules enabled)
- Warning about needing 10+ days for correlations
- Personalized Insights
- Icon: TrendingUp
```

### Step 5: Pro Tips 🎯
```jsx
- Log same time daily 🕐
- Add notes for unusual days 📝
- Don't chase perfection 🎯
- Check dashboard weekly 📊
- Icon: Target
```

## Styling Classes

### Container
```
fixed inset-0 bg-black/50 z-50 p-4
```

### Modal
```
bg-white rounded-xl shadow-2xl max-w-2xl max-h-[90vh]
```

### Header
```
bg-gradient-to-r from-blue-50 to-purple-50
```

### Content Area
```
overflow-y-auto p-6
```

### Footer
```
border-t bg-gray-50 p-6
```

## Dependencies

```jsx
import { X, CheckCircle, Target, TrendingUp, Calendar } from "lucide-react";
```

## State Management

```jsx
const [currentStep, setCurrentStep] = useState(0);
```

Single piece of state tracks which step (0-4) is currently displayed.

## Conditional Content

The guide adapts based on `moduleProfile.enabled_modules`:

```jsx
const hasGlucose = !!enabled.glucose;
const hasSleep = !!enabled.sleep;
const hasMigraine = !!enabled.migraine;
const hasPain = !!enabled.pain;
```

### Correlation Section (Step 4)
Only shows if user has:
- (Glucose OR Sleep) AND (Pain OR Migraine)

This ensures correlation info is only shown when correlations will actually be calculated.

## Image Asset

**Location:** `/public/assets/mobile-friendly_1.webp`
**Dimensions:** ~1920x1080 (16:9 ratio)
**Display:** Cropped to h-48 (192px) via `object-cover`
**Alt Text:** "Person using health tracking app"

## Integration Points

### Onboarding Flow
```jsx
// In ModuleOnboarding component
const [showQuickStart, setShowQuickStart] = useState(false);

async function handleFinish() {
  await markOnboardingComplete();
  setShowQuickStart(true); // Show guide instead of navigating
}

function handleQuickStartDismiss() {
  setShowQuickStart(false);
  navigate("/", { replace: true }); // Now navigate to dashboard
}
```

### Can Also Be Triggered From:
- Settings page ("View Quick Start Guide" button)
- Dashboard empty state
- Help menu
- First-time visitor detection

## Accessibility

- `aria-label` on close button
- `aria-label` on progress dots
- Keyboard navigable (Previous/Next buttons)
- Screen reader friendly step counter
- Semantic HTML structure

## Future Enhancements

### Potential Improvements
- [ ] Remember which step user was on if they close/reopen
- [ ] Add video tutorials for each step
- [ ] Interactive demo mode with fake data
- [ ] Checklist mode (mark steps as complete)
- [ ] Allow skipping individual steps
- [ ] Add "Don't show again" checkbox
- [ ] Track completion in analytics
- [ ] A/B test different copy/images

### Mobile Optimizations
- [ ] Smaller max-width on mobile
- [ ] Swipe gestures to navigate
- [ ] Simpler layouts for small screens
- [ ] Vertical progress indicator instead of dots
- [ ] Bottom sheet on mobile vs modal on desktop

## Testing

```bash
# Component should render without errors
npm run test -- QuickStartGuide.test.jsx

# Visual regression testing
npm run test:visual

# Accessibility testing
npm run test:a11y
```

## Notes

- Guide is shown exactly once per onboarding completion
- User can dismiss at any time (data is already saved)
- Content is intentionally concise to avoid overwhelming new users
- Uses consistent color scheme with rest of app (blue, purple, green, red, orange)
- All emojis are accessible (decorative, not semantic)
