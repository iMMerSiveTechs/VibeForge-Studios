# DecipherKit Integration Guide

**Version:** 1.0
**Audience:** Technical architects, integration engineers, product teams
**Last Updated:** 2026-03-19

---

## Quick Start

### For VibeForge Portfolio Apps

- **VibeForge Desk** → See Section: "Integration Example 1: VibeForge Desk"
- **Transplant Tracker** → See Section: "Integration Example 2: Transplant Tracker"
- **Estimate OS** → See Section: "Integration Example 3: Estimate OS"
- **Procurement OS** → See Section: "Integration Example 4: Procurement OS"

### For External Partners

- **SDK Integration (Mobile)** → See Section: "SDK Integration"
- **REST API Integration** → See Section: "REST API Integration"
- **Standalone Deployment** → See Section: "Standalone Deployment"

---

## Integration Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Partner Application (Web, Mobile, Desktop)                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Partner's Business Logic                                 │  │
│  │ (e.g., VibeForge Desk: sticky note management)          │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                            │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │ DecipherKit Integration Layer                            │  │
│  │                                                          │  │
│  │ Choose ONE of:                                          │  │
│  │ • SDK (native React Native / iOS / Android)            │  │
│  │ • REST API (any platform, any language)                │  │
│  │ • Embedded Web Component (React, Vue, Svelte)          │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                            │
│                     │ (encrypted HTTPS + OAuth2 / API key)      │
│                     │                                            │
└─────────────────────┼────────────────────────────────────────────┘
                      │
        ┌─────────────▼─────────────────────────┐
        │ DecipherKit Service                   │
        │                                       │
        │ • Image preprocessing                │
        │ • Character segmentation             │
        │ • Glyph recognition (personalized)   │
        │ • Confidence scoring                 │
        │ • Correction aggregation             │
        │                                       │
        │ Storage:                              │
        │ • User profiles (encrypted DB)       │
        │ • Transcription records (audit log)  │
        │ • Images (S3/GCS, encrypted)         │
        └─────────────────────────────────────┘
```

---

## Integration Method 1: SDK Integration (Recommended for Mobile)

### Platform Support
- **React Native:** Version 0.70+
- **iOS:** Version 13.0+, Swift 5.5+
- **Android:** API 24+, Kotlin 1.6+
- **Web:** React 16.8+, TypeScript 4.0+

### Installation

#### React Native
```bash
npm install @decipherkit/react-native-sdk
# or
yarn add @decipherkit/react-native-sdk
```

#### iOS (Swift Package Manager)
```swift
dependencies: [
    .package(url: "https://github.com/decipherkit/ios-sdk.git", from: "1.0.0")
]
```

#### Android (Gradle)
```gradle
dependencies {
    implementation 'com.decipherkit:android-sdk:1.0.0'
}
```

#### Web (React)
```bash
npm install @decipherkit/web-sdk
```

### Initialization

#### React Native Example
```javascript
import { DecipherKit } from '@decipherkit/react-native-sdk'

// Initialize at app startup
const decipher = new DecipherKit({
  apiKey: process.env.DECIPHER_API_KEY,
  partnerId: process.env.PARTNER_ID,
  environment: 'production', // 'sandbox' for testing
})

// Authenticate user (typically after your app's login flow)
await decipher.authenticateUser({
  userId: currentUser.id,
  email: currentUser.email,
  displayName: currentUser.name,
})

// Check if user is calibrated
const isCalibrated = await decipher.isUserCalibrated()
if (!isCalibrated) {
  // Navigate to calibration flow
  navigation.navigate('DecipherCalibration')
}
```

#### Web (React) Example
```javascript
import DecipherKit from '@decipherkit/web-sdk'

const decipher = new DecipherKit({
  apiKey: process.env.REACT_APP_DECIPHER_API_KEY,
  partnerId: process.env.REACT_APP_PARTNER_ID,
  container: document.getElementById('decipher-container'),
})

// Use React hooks
const { isCalibrated, calibrationScore } = useDecipherKit()
```

### Calibration Flow (User Onboarding)

```javascript
// Navigate user to calibration if not done
const calibrationResult = await decipher.startCalibration({
  onProgress: (step, total) => {
    console.log(`Calibration step ${step}/${total}`)
  },
  onComplete: (score) => {
    console.log(`Calibration complete! Score: ${score}`)
    // Save to app's user profile
    await saveUserProfile({ calibrationScore: score })
  },
  onError: (error) => {
    console.error('Calibration failed:', error.message)
    // Guide user to retry or contact support
  },
})

// calibrationResult structure:
// {
//   success: boolean,
//   score: 0.0-1.0,
//   glyphMapId: "glyph_abc123xyz",
//   message: "Calibration complete",
//   suggestedNextStep: "You're ready! Start transcribing."
// }
```

### Single-Word Transcription

```javascript
import { CameraRoll } from '@react-native-camera-roll/camera-roll'

// User takes photo or selects from gallery
const result = await decipher.transcribeImage({
  imageUri: selectedImage.uri,
  imageType: 'word', // 'word', 'line', 'page'
  includeConfidence: true,
  includeVariants: true,
})

// Result structure:
// {
//   text: "hello",
//   confidence: 0.98,
//   characters: [
//     { char: "h", confidence: 0.99 },
//     { char: "e", confidence: 0.98 },
//     { char: "l", confidence: 0.97 },
//     { char: "l", confidence: 0.97 },
//     { char: "o", confidence: 0.98 }
//   ],
//   variants: [
//     { variant: "helo", confidence: 0.01 },
//     { variant: "hollo", confidence: 0.005 }
//   ],
//   processingTimeMs: 1240,
//   recommendedConfidenceThreshold: 0.85
// }

// Display in UI with visual confidence indicators
renderTranscription(result)
```

### Page-Level Transcription (with Layout)

```javascript
const result = await decipher.transcribePage({
  imageUri: documentImage.uri,
  preserveLayout: true,
  returnMetadata: true,
})

// Result structure:
// {
//   text: "Line 1 text\nLine 2 text\n...",
//   layout: {
//     lines: [
//       {
//         text: "Line 1 text",
//         boundingBox: { x: 50, y: 100, width: 300, height: 30 },
//         baseline: 125,
//         confidence: 0.96
//       },
//       ...
//     ],
//     pageSize: { width: 2100, height: 2800 },
//     detectedLanguage: "en"
//   },
//   metadata: {
//     handedness: "right",
//     estimatedSlant: 8,
//     estimatedPressure: 0.65,
//     imageQualityScore: 0.92
//   }
// }
```

### Correction / Feedback Loop

```javascript
// User corrects a transcription
await decipher.recordCorrection({
  transcriptionId: originalResult.id,
  corrections: [
    {
      characterIndex: 0,
      predicted: 't', // what system said
      actual: 'T',     // what user corrected to
      confidence: 0.45, // original confidence
    },
    {
      characterIndex: 3,
      predicted: 'e',
      actual: 'a',
      confidence: 0.62,
    },
  ],
})

// After correction, personalized model updates immediately
const improvedResult = await decipher.transcribeImage({
  imageUri: similarImage.uri,
  // System now has updated glyph patterns from correction
})

// Get updated accuracy stats
const stats = await decipher.getUserStats()
// {
//   totalTranscriptions: 145,
//   totalCorrections: 12,
//   accuracy: 0.92,
//   recentAccuracy: 0.94,
//   mostCommonErrors: [
//     { predicted: 'a', actual: 'u', frequency: 3 },
//     { predicted: 'e', actual: 'a', frequency: 2 }
//   ]
// }
```

### Handling Errors & Edge Cases

```javascript
try {
  const result = await decipher.transcribeImage({
    imageUri: userImage.uri,
  })
} catch (error) {
  if (error.code === 'IMAGE_QUALITY_LOW') {
    // Guide user to retake photo
    showAlert('Please take a clearer photo')
  } else if (error.code === 'NOT_CALIBRATED') {
    // User hasn't completed calibration
    navigation.navigate('DecipherCalibration')
  } else if (error.code === 'QUOTA_EXCEEDED') {
    // User has exceeded monthly transcription limit
    showUpgradePrompt()
  } else if (error.code === 'NETWORK_ERROR') {
    // Offline mode: queue for later
    await queueTranscriptionForRetry(userImage)
  } else {
    console.error('Unexpected error:', error)
  }
}
```

### Advanced: Custom Domain Vocabulary

```javascript
// Load partner's domain vocabulary (medical, legal, technical)
await decipher.setDomainVocabulary({
  domain: 'medical',
  customTerms: {
    's/p': 'status post',
    'hx': 'history',
    'dx': 'diagnosis',
    'tx': 'treatment',
  },
})

// Now system will auto-correct abbreviations
// Predicted: "hx of mi"
// Corrected: "history of myocardial infarction" (if MI is in vocabulary)
```

### Offline Support (React Native)

```javascript
// Enable offline mode for field work
await decipher.enableOfflineMode({
  syncStrategy: 'queue-and-sync', // queue locally, sync when online
  maxQueueSize: 100, // queue up to 100 images
})

// Transcribe while offline (uses cached glyph map)
const result = await decipher.transcribeImage({
  imageUri: fieldImage.uri,
  // If offline, uses locally-cached glyph map
  // Results queued for sync when back online
})

// Listen for sync events
decipher.on('sync:start', () => console.log('Syncing...'))
decipher.on('sync:complete', (syncedCount) => {
  console.log(`${syncedCount} transcriptions synced`)
})
```

---

## Integration Method 2: REST API Integration

### Authentication
```bash
# Get API key from DecipherKit dashboard

# For server-to-server calls (HMAC-signed)
curl -X POST https://api.decipherkit.io/v1/partners/{partnerId}/transcribe \
  -H "Authorization: Bearer {apiKey}" \
  -H "Content-Type: application/json" \
  -d @payload.json

# For client-side calls (OAuth2)
const token = await getOAuthToken() // from DecipherKit OAuth provider
fetch('https://api.decipherkit.io/v1/transcribe', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### Endpoint: POST /v1/partners/{partnerId}/transcribe

```javascript
// Request
POST /v1/partners/vibeforge-studio/transcribe
Content-Type: multipart/form-data

{
  "image": <binary>,           // JPEG, PNG, or HEIC
  "userId": "user_123",         // String UUID
  "imageType": "word",          // 'word', 'line', or 'page'
  "confidence_threshold": 0.85, // Optional; default 0.85
  "preserve_layout": false,     // Optional; for page images
  "return_variants": true,      // Optional; include variant predictions
  "include_metadata": false     // Optional; include image analysis
}

// Response (200 OK)
{
  "transcriptionId": "txn_abc123xyz",
  "text": "hello",
  "confidence": 0.98,
  "characters": [
    { "char": "h", "confidence": 0.99, "position": { "x": 10, "y": 20 } },
    // ... one per character
  ],
  "variants": [
    { "text": "helo", "confidence": 0.01 },
    { "text": "hollo", "confidence": 0.005 }
  ],
  "processingTimeMs": 1240,
  "metadata": {
    "imageQualityScore": 0.92,
    "estimatedSlant": 8.5,
    "detectedLanguage": "en"
  },
  "userId": "user_123",
  "timestamp": "2026-03-19T14:30:00Z"
}

// Error Response (4xx/5xx)
{
  "error": {
    "code": "IMAGE_QUALITY_LOW",
    "message": "Image is too blurry or low contrast",
    "details": {
      "quality_score": 0.42,
      "minimum_required": 0.60,
      "recommendation": "Please retake photo with better lighting"
    }
  }
}
```

### Endpoint: POST /v1/partners/{partnerId}/correction

```javascript
POST /v1/partners/vibeforge-studio/correction
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user_123",
  "transcriptionId": "txn_abc123xyz",
  "corrections": [
    {
      "characterIndex": 0,
      "predicted": "t",
      "actual": "T",
      "confidence": 0.45
    },
    {
      "characterIndex": 3,
      "predicted": "e",
      "actual": "a",
      "confidence": 0.62
    }
  ]
}

// Response (200 OK)
{
  "appliedAt": "2026-03-19T14:31:00Z",
  "correctionsCount": 2,
  "updatedStats": {
    "totalCorrections": 42,
    "accuracy": 0.94,
    "recentAccuracy": 0.95
  },
  "accuracyDelta": +0.02,
  "nextRecommendedAction": "Your accuracy improved 2%. Keep going!"
}
```

### Endpoint: POST /v1/partners/{partnerId}/calibrate

```javascript
POST /v1/partners/vibeforge-studio/calibrate
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "userId": "user_123",
  "displayName": "Dr. Jane Doe",
  "calibrationImages": [
    { "image": <binary>, "word": "answer" },
    { "image": <binary>, "word": "because" },
    // ... 20 images total
  ]
}

// Response (200 OK)
{
  "calibrationId": "cal_abc123xyz",
  "userId": "user_123",
  "calibrationScore": 0.88,
  "status": "complete",
  "glyphMapId": "glyph_abc123xyz",
  "message": "Excellent calibration! You're ready to transcribe.",
  "processedAt": "2026-03-19T14:35:00Z",
  "insights": {
    "estimatedSlant": 9.2,
    "handednessHint": "right",
    "writingStyle": "cursive",
    "identifiedConfusionPairs": [
      { "char1": "a", "char2": "u", "confusionRate": 0.08 }
    ]
  }
}
```

### Endpoint: GET /v1/partners/{partnerId}/users/{userId}/stats

```javascript
GET /v1/partners/vibeforge-studio/users/user_123/stats
Authorization: Bearer {token}

// Response (200 OK)
{
  "userId": "user_123",
  "displayName": "Dr. Jane Doe",
  "totalTranscriptions": 145,
  "totalCorrections": 12,
  "accuracy": 0.92,
  "recentAccuracy": 0.94,
  "calibrationScore": 0.88,
  "calibrationDate": "2026-02-15T10:00:00Z",
  "lastUsed": "2026-03-19T14:30:00Z",
  "streakDaysActive": 18,
  "mostCommonErrors": [
    { "predicted": "a", "actual": "u", "frequency": 3 },
    { "predicted": "e", "actual": "a", "frequency": 2 }
  ],
  "estimatedNextMilestone": "Reach 95% accuracy in 1-2 weeks"
}
```

### Endpoint: GET /v1/partners/{partnerId}/users/{userId}/profile

```javascript
GET /v1/partners/vibeforge-studio/users/user_123/profile
Authorization: Bearer {token}

// Response (200 OK) - Returns full user profile (see user-profile-schema.json)
{
  "userId": "user_123",
  "displayName": "Dr. Jane Doe",
  "created": "2026-02-15T10:00:00Z",
  "calibrationComplete": true,
  "calibrationScore": 0.88,
  "glyphMap": {
    "version": "1.0",
    "generatedAt": "2026-02-15T10:15:00Z",
    "basedOnSamples": 20,
    "characters": { /* ... see schema ... */ },
    "confusionPairs": [
      { "char1": "a", "char2": "u", "confusionRate": 0.08 }
    ]
  },
  "stats": {
    "totalTranscriptions": 145,
    "totalCorrections": 12,
    "accuracy": 0.92,
    // ... etc
  }
}
```

### Endpoint: DELETE /v1/partners/{partnerId}/users/{userId}

```javascript
DELETE /v1/partners/vibeforge-studio/users/user_123
Authorization: Bearer {token}

// Response (200 OK)
{
  "userId": "user_123",
  "deletedAt": "2026-03-19T14:45:00Z",
  "message": "User profile and all data deleted",
  "dataRetention": "Correction logs kept for 90 days for analytics; then purged"
}
```

---

## Integration Example 1: VibeForge Desk

**Scenario:** User writes sticky notes on physical paper, wants digital stickies with transcription

### Architecture
```
VibeForge Desk App
├── Sticky Note Input (handwritten)
├── Camera Capture / Upload
├── DecipherKit SDK (transcribeImage)
└── Digital Sticky Display (text + original image)
```

### Implementation

```typescript
// src/features/sticky-notes/StickyNoteTranscription.tsx

import React, { useState } from 'react'
import { DecipherKit } from '@decipherkit/react-native-sdk'
import CameraRoll from '@react-native-camera-roll/camera-roll'

interface StickyNote {
  id: string
  imageUri: string
  handwrittenText: string
  transcribedText: string
  confidence: number
  color: string
  createdAt: Date
}

export const StickyNoteInput: React.FC = () => {
  const [notes, setNotes] = useState<StickyNote[]>([])
  const decipher = useDecipherKit() // Custom hook wrapping DecipherKit SDK

  const handleCaptureNote = async () => {
    // 1. User takes photo of sticky note (via camera)
    const image = await CameraRoll.getPhotos({ first: 1 })
    const imageUri = image.edges[0].node.image.uri

    // 2. Show loading spinner
    setLoading(true)

    try {
      // 3. Call DecipherKit to transcribe
      const result = await decipher.transcribeImage({
        imageUri,
        imageType: 'word', // Sticky notes are typically short text
        includeConfidence: true,
      })

      // 4. Create sticky note object
      const newNote: StickyNote = {
        id: generateUUID(),
        imageUri,
        handwrittenText: image, // Store original for reference
        transcribedText: result.text,
        confidence: result.confidence,
        color: randomStickyColor(),
        createdAt: new Date(),
      }

      // 5. Save to local database (AsyncStorage / SQLite)
      await saveStickyNote(newNote)
      setNotes([...notes, newNote])

      // 6. Show confirmation with option to correct
      if (result.confidence < 0.90) {
        showCorrectionPrompt(result.id)
      } else {
        showToast('Note transcribed!')
      }
    } catch (error) {
      handleTranscriptionError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCorrectNote = async (note: StickyNote, correctedText: string) => {
    // User taps on transcription to correct it
    const corrections = calculateCharacterDifferences(
      note.transcribedText,
      correctedText
    )

    await decipher.recordCorrection({
      transcriptionId: note.id,
      corrections,
    })

    // Update note with corrected text
    await updateStickyNote(note.id, { transcribedText: correctedText })
    setNotes(
      notes.map((n) => (n.id === note.id ? { ...n, transcribedText: correctedText } : n))
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleCorrectNote(item, editTranscription(item.transcribedText))}
          >
            <View
              style={[
                styles.stickyNote,
                { backgroundColor: item.color },
                item.confidence < 0.90 && styles.needsReview,
              ]}
            >
              <Text>{item.transcribedText}</Text>
              {item.confidence < 1 && (
                <Text style={styles.confidence}>{(item.confidence * 100).toFixed(0)}% confident</Text>
              )}
            </View>
          </Pressable>
        )}
      />
      <Button title="Add Note" onPress={handleCaptureNote} />
    </View>
  )
}
```

### Integration Benefits for VibeForge Desk
- **Zero Friction:** Users write naturally; no re-typing
- **Personalization:** Accuracy improves with every correction
- **Offline Support:** DecipherKit offline mode lets field workers capture notes offline, sync later
- **Compliance:** GDPR-compliant; no third-party transcription services
- **Upsell:** Sticky-note-to-calendar conversion, sharing, collaboration features all get better with accurate transcription

---

## Integration Example 2: Transplant Tracker

**Scenario:** Doctor writes patient notes on exam. Transplant Tracker needs to extract structured data (patient ID, vital signs, observations) from handwritten notes.

### Architecture
```
Transplant Tracker Mobile App
├── Doctor handwrites note during exam
├── Photo capture + DecipherKit REST API (calibrated for medical abbreviations)
├── Medical NLP Layer (extract entities: diagnosis, treatment, vitals)
└── Structured Data (EHR integration)
```

### Implementation

```typescript
// src/services/medicalTranscription.ts

import axios from 'axios'
import { DecipherKitClient } from '@decipherkit/rest-client'

interface ExamNotes {
  patientId: string
  noteImageUri: string
  rawTranscription: string
  structuredData: MedicalData
  confidence: number
}

interface MedicalData {
  diagnosis: string[]
  vitals: VitalsRecord
  medications: string[]
  observations: string
  recommendedFollowUp: string
}

export class MedicalTranscriptionService {
  private decipher: DecipherKitClient
  private medicalNLP: MedicalNLPEngine

  constructor(apiKey: string) {
    this.decipher = new DecipherKitClient({
      apiKey,
      partnerId: 'transplant-tracker',
      domain: 'medical', // Use medical vocabulary
    })
    this.medicalNLP = new MedicalNLPEngine()
  }

  async transcribeExamNotes(noteImageUri: string, patientId: string): Promise<ExamNotes> {
    // 1. Transcribe handwritten note
    const transcription = await this.decipher.transcribePage({
      imageUri: noteImageUri,
      preserveLayout: true,
      includeMetadata: true,
    })

    // 2. Extract medical entities using NLP
    const structuredData = await this.medicalNLP.extractEntities(transcription.text, {
      domain: 'transplant_surgery',
      patientId,
    })

    // 3. Validate extracted data (e.g., vitals in normal ranges)
    this.validateMedicalData(structuredData)

    // 4. Create audit log entry (for HIPAA compliance)
    await this.createAuditLog({
      action: 'transcribe_exam_notes',
      patientId,
      transcriptionId: transcription.transcriptionId,
      timestamp: new Date(),
    })

    // 5. Return structured data for EHR insertion
    const result: ExamNotes = {
      patientId,
      noteImageUri,
      rawTranscription: transcription.text,
      structuredData,
      confidence: transcription.confidence,
    }

    return result
  }

  async recordExamNoteCorrection(
    transcriptionId: string,
    userCorrections: string,
    originalTranscription: string
  ) {
    // Doctor reviews transcription and makes corrections
    const corrections = this.calculateDifferences(originalTranscription, userCorrections)

    // Send to DecipherKit for personalized model update
    await this.decipher.recordCorrection({
      userId: getCurrentDoctorId(),
      transcriptionId,
      corrections,
    })

    // Re-extract medical entities with updated transcription
    const updatedStructuredData = await this.medicalNLP.extractEntities(userCorrections)

    return updatedStructuredData
  }

  private validateMedicalData(data: MedicalData) {
    // Sanity checks on extracted data
    if (data.vitals.bloodPressure > 200) {
      console.warn('Blood pressure unusually high; review transcription')
    }
  }

  private async createAuditLog(entry: AuditLogEntry) {
    // HIPAA requirement: log all access to patient data
    await database.auditLogs.insert(entry)
  }
}

// Usage in UI
export async function handleExamNoteUpload(noteImage: ImageSource) {
  const transcriptionService = new MedicalTranscriptionService(apiKey)
  const examNotes = await transcriptionService.transcribeExamNotes(
    noteImage.uri,
    currentPatient.id
  )

  // Display transcription + structured data for doctor review
  showExamNoteReview(examNotes)

  // On doctor approval, send to EHR
  await ehrupdatePatientNotes(currentPatient.id, examNotes.structuredData)
}
```

### Integration Benefits for Transplant Tracker
- **Data Extraction:** Handwritten exam notes → structured EHR data (diagnosis, medications, follow-up)
- **Compliance:** HIPAA-compliant with audit trails
- **Accuracy in Medical Domain:** Personalized glyph maps + medical vocabulary improve accuracy on medical abbreviations (s/p, dx, etc.)
- **Time Savings:** Doctor writes once; data auto-populates EHR
- **Liability Reduction:** Audit log + correction history provides evidence of accurate transcription

---

## Integration Example 3: Estimate OS

**Scenario:** Field worker writes measurements and notes on site. Estimate OS needs to convert handwritten specs → line items → invoice.

### Architecture
```
Estimate OS Mobile App
├── Field Worker writes measurements (feet, inches, quantities, materials)
├── Camera capture + DecipherKit SDK (offline-capable)
├── Number/measurement extraction
├── Catalog lookup (match "2x4 pine" → SKU, price)
└── Line item generation → PDF estimate
```

### Implementation

```typescript
// src/features/field-capture/MeasurementTranscription.ts

import { DecipherKit } from '@decipherkit/react-native-sdk'

interface LineItem {
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

interface EstimateCapture {
  siteAddress: string
  measurements: LineItem[]
  totalEstimate: number
  notes: string
}

export class FieldMeasurementCapture {
  private decipher: DecipherKit
  private catalog: ProductCatalog

  async captureFieldNotes(noteImage: string): Promise<EstimateCapture> {
    // Enable offline mode for field work (no cell service)
    await this.decipher.enableOfflineMode({
      syncStrategy: 'queue-and-sync',
    })

    // 1. Transcribe handwritten measurements
    const transcription = await this.decipher.transcribeImage({
      imageUri: noteImage,
      imageType: 'page',
      preserveLayout: true,
    })

    // 2. Parse measurements (e.g., "12 ft x 8 ft drywall" → quantity: 12 ft, material: drywall)
    const lineItems = await this.parseMeasurements(transcription.text)

    // 3. Look up catalog prices
    const itemsWithPricing = await Promise.all(
      lineItems.map(async (item) => ({
        ...item,
        unitPrice: await this.catalog.lookup(item.description),
        totalPrice: item.quantity * (await this.catalog.lookup(item.description)),
      }))
    )

    // 4. Generate estimate
    const estimate: EstimateCapture = {
      siteAddress: getCurrentSiteAddress(),
      measurements: itemsWithPricing,
      totalEstimate: itemsWithPricing.reduce((sum, item) => sum + item.totalPrice, 0),
      notes: transcription.text,
    }

    // 5. Save locally (offline)
    await this.saveOfflineEstimate(estimate)

    // 6. When back online, sync to server
    this.decipher.on('sync:complete', async (count) => {
      await this.uploadEstimate(estimate)
      showToast(`Estimate synced!`)
    })

    return estimate
  }

  private async parseMeasurements(text: string): Promise<LineItem[]> {
    // Extract lines like "10 ft x 12 ft drywall" or "2x4 pine, 8 pieces"
    const patterns = [
      /(\d+)\s*(?:x\s*)?(\d+)?\s*(ft|inch|in|m|cm)?\s+([a-z\s]+)/gi, // "10 ft x 12 ft drywall"
      /(\d+)\s*(?:pieces?|pcs?)\s+([a-z\s]+)/gi, // "10 pieces wood"
    ]

    const lineItems: LineItem[] = []
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)]
      for (const match of matches) {
        lineItems.push({
          description: match[4] || match[2],
          quantity: parseInt(match[1], 10),
          unit: match[3] || 'piece',
          unitPrice: 0, // Filled in by catalog lookup
          totalPrice: 0,
        })
      }
    }
    return lineItems
  }

  private async saveOfflineEstimate(estimate: EstimateCapture) {
    // SQLite database on device
    await offlineDB.estimates.insert(estimate)
  }

  private async uploadEstimate(estimate: EstimateCapture) {
    // When synced, upload to server
    const response = await api.post('/estimates', estimate)
    return response.data
  }
}
```

### Integration Benefits for Estimate OS
- **Offline Capability:** Field workers write measurements offline; DecipherKit caches glyph map locally
- **Handwriting → Structured Data:** Field notes → line items → pricing automatically
- **Time Savings:** Skip office data entry; estimates auto-generated from field notes
- **Accuracy:** Personalized models trained on field worker's handwriting (site addresses, measurements)
- **Audit Trail:** Original handwritten image + transcription preserved for disputes

---

## Integration Example 4: Procurement OS

**Scenario:** Procurement officer writes shopping lists. Procurement OS converts to structured requisitions.

### Implementation

```typescript
// src/features/procurement/ShoppingListTranscription.ts

interface ShoppingListItem {
  itemName: string
  quantity: number
  vendor: string
  estimatedCost: number
}

export async function transcribeShoppingList(listImageUri: string) {
  const decipher = useDecipherKit()
  const vendorCatalog = useVendorCatalog()

  // 1. Transcribe handwritten list
  const transcription = await decipher.transcribeImage({
    imageUri: listImageUri,
    imageType: 'page',
  })

  // 2. Parse list items (e.g., "50 widgets - Supplier A" → itemName, quantity, vendor)
  const items = transcription.text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => parseListItem(line))

  // 3. Look up vendors and costs
  const enrichedItems: ShoppingListItem[] = await Promise.all(
    items.map(async (item) => ({
      itemName: item.name,
      quantity: item.quantity,
      vendor: item.vendor || (await vendorCatalog.suggestBestVendor(item.name)),
      estimatedCost: await vendorCatalog.getPrice(item.name, item.quantity),
    }))
  )

  // 4. Create PO (purchase order)
  const po = {
    id: generatePOId(),
    items: enrichedItems,
    totalCost: enrichedItems.reduce((sum, item) => sum + item.estimatedCost, 0),
    createdAt: new Date(),
    approvalStatus: 'pending_review',
  }

  // 5. Send for approval
  await sendPOForApproval(po)

  return po
}

function parseListItem(line: string): { name: string; quantity: number; vendor?: string } {
  // Parse "50 widgets - Supplier A" or "100x screws (home depot)"
  const match = line.match(/(\d+)\s*x?\s*([^-()]+)(?:\s*-\s*(.+))?/)
  if (match) {
    return {
      quantity: parseInt(match[1], 10),
      name: match[2].trim(),
      vendor: match[3]?.trim(),
    }
  }
  return { name: line.trim(), quantity: 1 }
}
```

---

## Standalone Deployment

For partners who want to run DecipherKit entirely on their own infrastructure:

### Docker Deployment
```bash
docker pull decipherkit/service:latest
docker run -e API_KEY=xxx \
  -e PARTNER_ID=my-partner \
  -p 8080:8080 \
  decipherkit/service:latest
```

### Environment Variables
```bash
API_KEY                  # DecipherKit API key
PARTNER_ID              # Your partner ID
DATABASE_URL            # PostgreSQL connection string
S3_BUCKET              # AWS S3 bucket for images
REDIS_URL              # Redis for caching glyph maps
ENVIRONMENT            # 'production' or 'sandbox'
LOG_LEVEL              # 'debug', 'info', 'warn', 'error'
```

### Self-Hosted Model Serving
For ultra-sensitive data (government, military), DecipherKit can be deployed entirely on-premises with your own model servers.

---

## Testing & Validation

### Unit Testing (SDK)
```typescript
describe('DecipherKit SDK', () => {
  it('should transcribe a calibration image', async () => {
    const result = await decipher.transcribeImage({
      imageUri: 'file://calibration-word.png',
    })
    expect(result.text).toBe('answer')
    expect(result.confidence).toBeGreaterThan(0.85)
  })

  it('should record corrections and update accuracy', async () => {
    await decipher.recordCorrection({
      transcriptionId: 'txn_123',
      corrections: [{ characterIndex: 0, predicted: 'a', actual: 'u' }],
    })
    const stats = await decipher.getUserStats()
    expect(stats.accuracy).toBeGreaterThan(previousAccuracy)
  })
})
```

### Integration Testing (REST API)
```bash
# Test transcription endpoint
curl -X POST http://localhost:8080/v1/partners/test-partner/transcribe \
  -H "Authorization: Bearer test-token" \
  -F "image=@test-image.png" \
  -F "userId=test-user" \
  -F "imageType=word"

# Test correction endpoint
curl -X POST http://localhost:8080/v1/partners/test-partner/correction \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "transcriptionId": "txn_123",
    "corrections": [...]
  }'
```

### Load Testing
```bash
# Using Apache JMeter or similar
# Simulate 100 users, 1000 transcriptions/min
# Target: <5 second response time at P95
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "NOT_CALIBRATED" error | User hasn't completed calibration | Call `startCalibration()` first |
| "IMAGE_QUALITY_LOW" | Blurry, low-contrast, or shadowed image | Retake photo with better lighting, steady hand |
| "QUOTA_EXCEEDED" | User exceeded monthly transcription limit | Upgrade subscription tier |
| "NETWORK_ERROR" | No internet connection | Enable offline mode (mobile) or queue for retry |
| High correction rate after calibration | Inconsistent handwriting or poor calibration images | Suggest recalibration with clearer images |
| Confidence scores too low (always <0.70) | Glyph map not matching user's current writing | User may have changed pen, writing style, or paper |

---

## Security Checklist

- [ ] API keys stored securely (environment variables, not hardcoded)
- [ ] HTTPS enforced (TLS 1.3+)
- [ ] OAuth2 or HMAC signing implemented
- [ ] User data encrypted at rest (AES-256)
- [ ] Audit logs for all data access
- [ ] Rate limiting enabled (prevent abuse)
- [ ] CORS properly configured (whitelist partner domains)
- [ ] Input validation on all API endpoints
- [ ] Regular security audits / penetration testing
- [ ] HIPAA/GDPR compliance verified (if applicable)

---

## Next Steps

1. **Choose Integration Method:** SDK (mobile), REST API (any platform), or Standalone
2. **Get API Key:** Contact DecipherKit sales team or use sandbox credentials
3. **Implement Calibration Flow:** Guide users through 5-10 minute calibration
4. **Test with Sample Images:** Use provided test images to validate accuracy
5. **Deploy to Production:** Follow deployment checklist above
6. **Monitor Metrics:** Track accuracy, user retention, error rates
7. **Continuous Improvement:** Collect feedback, update domain vocabulary, retrain models

---

## Support & Resources

- **API Documentation:** https://api.decipherkit.io/docs
- **SDK Samples:** https://github.com/decipherkit/integration-samples
- **Support Email:** integrations@decipherkit.io
- **Slack Channel:** #decipherkit-support (for white-label partners)
- **Status Page:** https://status.decipherkit.io

---

**End of Integration Guide**
