# EasyCal - Brand-Aware Bulk Calendar Manager

A production-grade, iframe-embeddable web application for bulk calendar management in GoHighLevel. Create, manage, and delete calendars in bulk with automatic brand application and advanced scheduling features.

## 🎨 Key Features

### Brand-Aware Calendar Creation
- **Brand Configuration**: Set default colors, button text, and timezone per location
- **Smart Branding**: Automatically applies brand colors and button text to all calendars
- **Override Support**: Individual CSV rows can override brand settings
- **Purpose-Based Buttons**: Automatic button text for makeup classes ("Schedule Make-Up")

### Advanced CSV Import
- **Comprehensive Field Support**: 17 different calendar fields including schedule blocks
- **Schedule Blocks**: Support for multi-day/multi-time calendars ("Mon 09:00-10:00; Wed 14:30-15:30")
- **Group Auto-Creation**: Automatically creates calendar groups if they don't exist
- **Smart Slug Generation**: Auto-generates unique URL slugs with conflict resolution
- **Dry-Run Preview**: Validate and preview all calendars before importing
- **Idempotency**: Prevents duplicate calendars on re-import

### Production Features
- **OAuth Integration**: Secure authentication with GoHighLevel using the official SDK
- **Multi-Tenant Architecture**: Support for agency-level and location-level installations
- **Iframe Safe**: Optimized for embedding with automatic height adjustment
- **Rate Limiting**: Built-in rate limiting to respect GoHighLevel API limits
- **Error Handling**: Comprehensive validation and error handling
- **Real-time Progress**: Live updates during bulk operations

## 📊 CSV Format

### Required Fields
- `calendar_type`: Must be "event" for GoHighLevel event calendars
- `calendar_name`: Display name for the calendar (e.g., "Yoga Basics")
- `day_of_week`: Day of the week (Monday, Tuesday, etc.)
- `time_of_week`: Time range in 24-hour format (e.g., "09:00-10:00")
- `slot_interval`: Time slot interval in minutes (e.g., 30, 60)
- `class_duration`: Duration of each session in minutes
- `min_scheduling_notice`: Minimum days notice required for booking
- `max_bookings_per_day`: Maximum number of bookings allowed per day

### Optional Fields
- `class_description`: Brief description of the class or service
- `calendar_group`: Group/category to organize calendars (auto-created if needed)
- `custom_url`: Custom URL slug (auto-generated if not provided)
- `button_text`: Override default button text
- `primary_color_hex`: Override brand primary color (#RRGGBB)
- `background_color_hex`: Override brand background color (#RRGGBB)
- `timezone`: Override default timezone (IANA format)
- `calendar_purpose`: Type of calendar (trial, makeup, regular)
- `schedule_blocks`: Multi-day/time format ("Mon 09:00-10:00; Wed 14:30-15:30")

### Sample CSV
```csv
calendar_type,calendar_name,day_of_week,time_of_week,slot_interval,class_duration,min_scheduling_notice,max_bookings_per_day,class_description,calendar_group,custom_url,button_text,primary_color_hex,background_color_hex,timezone,calendar_purpose,schedule_blocks
event,Tiny Tots (Ages 2–3),Saturday,09:00-09:30,15,30,1,12,Intro to movement for toddlers,Saturday Trials,tiny-tots,Reserve Spot,#FFC300,#FFFFFF,America/New_York,trial,"Sat 09:00-09:30; Sat 10:00-10:30"
event,Make-Up Class Portal,Monday,15:00-17:00,15,30,0,30,Flexible scheduling for missed classes,Makeup Classes,makeup-portal,,#FFD60A,#FFFFFF,America/New_York,makeup,"Mon 15:00-17:00; Thu 15:00-17:00"
```

## 🛠 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS** with custom brand styling
- **Radix UI** for accessible components
- **Lucide React** for icons

### Backend
- **Cloudflare Pages Functions** (serverless)
- **Cloudflare D1** (SQLite database)
- **Cloudflare KV** (session and CSRF state)
- **Cloudflare Queues** (background job processing)

### Integrations
- **GoHighLevel API** via official SDK
- **Papaparse** for CSV processing
- **Bottleneck** for rate limiting
- **Drizzle ORM** for database operations

## 📁 Project Structure

```
src/
├── app/
│   ├── (app)/                    # Protected app routes
│   │   ├── calendars/           # Calendar list & bulk delete
│   │   ├── import/              # CSV upload & mapping
│   │   ├── jobs/[jobId]/        # Job progress & results
│   │   ├── settings/            # Location & default management
│   │   └── layout.tsx           # App layout with TopBar
│   ├── (auth)/                  # Authentication routes
│   │   ├── auth/install/        # OAuth initiation
│   │   └── auth/callback/       # OAuth callback handling
│   ├── globals.css              # Global styles & brand colors
│   ├── layout.tsx               # Root layout with error boundary
│   └── page.tsx                 # Dashboard landing page
├── components/
│   ├── ui/                      # Reusable UI components
│   │   └── button.tsx           # Button component
│   ├── ErrorBoundary.tsx        # Error handling component
│   ├── FieldMapper.tsx          # CSV field mapping interface
│   ├── LocationSwitcher.tsx     # Location selection dropdown
│   ├── TopBar.tsx               # App header with iframe support
│   └── UploadDropzone.tsx       # File upload component
├── lib/
│   ├── auth/                    # Authentication utilities
│   ├── db/                      # Database client & encryption
│   │   ├── client.ts            # D1 database client
│   │   ├── encryption.ts        # Token encryption utilities
│   │   └── schema.ts            # Drizzle schema definitions
│   ├── jobs/                    # Background job processing
│   │   └── queue.ts             # Job queue with rate limiting
│   └── sdk/                     # GoHighLevel API client
│       └── client.ts            # SDK wrapper with retry logic
```

## 🗄 Database Schema

### Tenants Table
```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  created_at INTEGER,
  name TEXT NOT NULL,
  install_context TEXT NOT NULL,
  agency_id TEXT
);
```

### Locations Table
```sql
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  is_enabled INTEGER DEFAULT 1
);
```

### Tokens Table
```sql
CREATE TABLE tokens (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  location_id TEXT REFERENCES locations(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  scope TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
```

### Jobs & Job Items Tables
```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  location_id TEXT REFERENCES locations(id),
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  total INTEGER NOT NULL,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE job_items (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  input TEXT NOT NULL,
  result TEXT,
  status TEXT NOT NULL,
  error_message TEXT
);
```

## 🔧 Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account with D1, KV, and Queues enabled

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:
   ```env
   # GoHighLevel API Configuration
   HL_CLIENT_ID=your_client_id_here
   HL_CLIENT_SECRET=your_client_secret_here
   HL_PIT=your_private_integration_token_here

   # App Configuration
   APP_BASE_URL=https://easycal.pages.dev
   SESSION_SECRET=your_session_secret_here

   # Cloudflare Bindings
   D1_BINDING=DB
   KV_BINDING=EASYCAL_SESSIONS
   QUEUE_BINDING=EASYCAL_JOBS

   # Encryption (32-byte base64 key)
   ENCRYPTION_KEY=your_32_byte_base64_encryption_key_here
   ```

3. **Database Setup:**
   ```bash
   # Generate encryption key
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

   # Push schema to D1
   npx drizzle-kit push
   ```

4. **Development:**
   ```bash
   npm run dev
   ```

### Cloudflare Deployment

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

2. **Configure Cloudflare:**
   ```bash
   wrangler login
   wrangler pages project create easycal
   ```

3. **Set up D1 Database:**
   ```bash
   wrangler d1 create easycal-db
   wrangler d1 execute easycal-db --file=./schema.sql
   ```

4. **Deploy:**
   ```bash
   npm run build
   wrangler pages deploy ./out
   ```

## 🔐 Security Features

- **Encrypted Token Storage**: All OAuth tokens encrypted at rest using WebCrypto API
- **CSRF Protection**: State parameter validation in OAuth flow
- **Rate Limiting**: Bottleneck-based rate limiting for API calls
- **Input Validation**: Comprehensive validation for CSV data and API inputs
- **Secure Headers**: CSP, X-Frame-Options, and other security headers
- **Error Boundaries**: Graceful error handling with user-friendly messages

## 🎨 Brand Customization

The app uses a custom brand palette defined in `globals.css`:

```css
:root {
  --brand-navy: #000814;
  --brand-yellow: #FFC300;
  --brand-light-yellow: #FFD60A;
}
```

## 📊 API Usage

### GoHighLevel Integration
- **Calendars API**: List, create, and delete calendars
- **OAuth Flow**: Secure token exchange and refresh
- **Location Management**: Multi-location support for agencies

### Rate Limiting
- 3 concurrent requests maximum
- 250ms minimum time between requests
- 100 requests per minute reservoir
- Automatic retry with exponential backoff

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests (Playwright)
```bash
npx playwright install
npx playwright test
```

## 📈 Performance

- **Serverless**: Zero cold start with Cloudflare Pages Functions
- **Edge Network**: Global CDN for fast response times
- **Optimized Bundles**: Tree-shaking and code splitting
- **Lazy Loading**: Components loaded on demand

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the [GoHighLevel Developer Docs](https://developers.gohighlevel.com)
- Review Cloudflare Pages Functions documentation
- Open an issue on GitHub

---

**Built with ❤️ for simple calendar management**