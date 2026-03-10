netsimd I 03-04 19:36:15.929 daemon\src\rust_main.rs:100 - netsim artifacts path: "C:\\Users\\SNTS\\AppData\\Local\\Temp\\netsimd"
netsimd I 03-04 19:36:15.961 daemon\src\rust_main.rs:103 - NetsimdArgs {
    fd_startup_str: None,
    no_cli_ui: true,
    no_web_ui: true,
    pcap: false,
    disable_address_reuse: false,
    hci_port: None,
    connector_instance: None,
    instance: None,
    logtostderr: false,
    dev: false,
    forward_host_mdns: false,
    vsock: None,
    config: None,
    host_dns: Some(
        "192.168.1.1",
    ),
    http_proxy: None,
    wifi_tap: None,
    wifi: None,
    test_beacons: false,
    no_test_beacons: false,
    no_shutdown: false,
    verbose: false,
    version: false,
    debug: DebugArgs {
        debug_no_traffic: false,
        debug_no_network: false,
        debug_no_wmedium: false,
        debug_no_mdns_wmedium: false,
        debug_no_guest_to_host_mdns: false,
    },
    rssi: None,
}

# Lumina — AI Media Generation Platform

Full-stack AI media platform where users submit text prompts, Chrome extension workers process them via Google Labs Flow AI, and users can view/download generated images and videos.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Native   │────▶│  Fastify Backend  │────▶│    Supabase     │
│  (Expo) Mobile  │     │   (Node.js API)   │     │  DB + Storage   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                  ▲
                        ┌─────────┴────────┐
                        │ Chrome Extension  │
                        │   (Workers)       │
                        └──────────────────┘
```

## Project Structure

```
/
├── backend/                # Fastify API server
│   ├── src/
│   │   ├── routes/         # auth, prompts, media, workers, admin
│   │   ├── middleware/     # auth.js (JWT + admin check)
│   │   └── services/       # supabase.js, storage.js, worker.js
│   ├── .env.example
│   └── package.json
│
├── mobile/                 # Expo React Native app
│   ├── src/
│   │   ├── screens/        # Login, Register, Dashboard, Generate, Detail, Profile, Admin
│   │   ├── components/     # MediaCard, SkeletonCard, StatusBadge
│   │   ├── navigation/     # AppNavigator (tab + stack)
│   │   ├── services/       # api.js
│   │   └── store/          # useAuthStore.js (Zustand)
│   ├── App.js
│   └── package.json
│
└── supabase-setup.sql      # RLS policies + admins table
```

---

## Setup

### 1. Supabase

1. Your Supabase project: `https://mjtmpkfvzrtvyqgmpdhi.supabase.co`
2. Run `supabase-setup.sql` in the Supabase SQL Editor
3. Create the `media` storage bucket (public) in Supabase Dashboard > Storage
4. Get your **Service Role Key** from Project Settings > API

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=https://mjtmpkfvzrtvyqgmpdhi.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
PORT=3000
```

```bash
npm run dev    # development (auto-restart)
npm start      # production
```

### 3. Mobile App

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `.env`:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
```

> Use your machine's local IP (e.g. `192.168.1.10`) not `localhost` when testing on a physical device.

```bash
npx expo start
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register with email + password + name |
| POST | `/api/auth/login` | — | Login, returns JWT token |
| GET | `/api/auth/me` | ✓ | Get current user info |

### Prompts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/prompts` | ✓ | Create prompt (rate limited: 10/min) |
| GET | `/api/prompts` | ✓ | List user prompts (`?page=1&limit=20&status=&mode=`) |
| GET | `/api/prompts/:id` | ✓ | Get single prompt |
| DELETE | `/api/prompts/:id` | ✓ | Delete prompt + storage files |

### Media
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/media/:promptId` | ✓ | Get output URLs for a prompt |
| POST | `/api/media/bulk-download` | ✓ | Download multiple prompts as ZIP |

### Workers
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/workers` | ✓ | List active workers |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/workers` | All workers |
| POST | `/api/admin/workers` | Add worker by project_id |
| DELETE | `/api/admin/workers/:id` | Remove worker |
| GET | `/api/admin/prompts` | All prompts, all users |
| POST | `/api/admin/prompts` | Create prompt for any user |
| PATCH | `/api/admin/prompts/:id/retry` | Retry failed prompt |
| DELETE | `/api/admin/prompts/:id` | Delete any prompt |
| GET | `/api/admin/stats` | Dashboard statistics |

---

## Making a User an Admin

After the user registers, run in Supabase SQL Editor:
```sql
insert into admins (user_id)
values ('USER-UUID-FROM-PUBLIC.USERS-TABLE');
```

The admin will see an "Admin Dashboard" button on their Profile screen.

---

## All API Responses

Success:
```json
{ "success": true, "data": { ... } }
```

Error:
```json
{ "success": false, "error": "message" }
```

---

## Worker Assignment Logic

When a prompt is created, the backend:
1. Queries `workers` table for `status = 'active'` AND `last_ping > now() - 2 minutes` AND `worker_type IN (mode, 'ALL')`
2. Orders by `current_load ASC`, picks the first (least loaded)
3. Sets `assigned_tab_id` and `machine_id` on the prompt
4. Increments `current_load` on the worker

If no worker is available, the prompt is still saved as `pending` — the Chrome extension can pick it up.

---

## Chrome Extension Integration

The Chrome extension (worker) should:
- Periodically `PATCH /workers` to update `last_ping` (keep-alive)
- Poll for assigned prompts (`assigned_tab_id = tab.id`)
- Process via Google Labs Flow AI
- Update prompt status to `completed` or `failed`
- Upload output files to Supabase storage at: `media/{promptId}/{promptId}_{index}.jpg`
- Set `output_urls` array on the prompt record

---

## Key Features

- **Real-time polling**: App polls every 5s for pending/processing prompts
- **Bulk download**: Select multiple prompts → download as ZIP
- **Admin dashboard**: Full management UI (workers, prompts, stats, manual injection)
- **Rate limiting**: 10 prompts/minute per user
- **Skeleton loading**: Smooth loading states while fetching
- **Dark mode**: Full dark theme throughout
- **Offline-aware**: Shows "queued" state when no worker available
