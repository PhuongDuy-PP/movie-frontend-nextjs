# Frontend Movie Booking - Next.js

Frontend cho hệ thống đặt vé xem phim được xây dựng với Next.js, TypeScript và Tailwind CSS.

## Tính năng

- ✅ Trang chủ với banner, phim đang chiếu
- ✅ Danh sách phim và chi tiết phim
- ✅ Danh sách rạp chiếu
- ✅ Lịch chiếu phim
- ✅ Đặt vé với chọn ghế
- ✅ Đăng nhập/Đăng ký
- ✅ Quản lý vé đã đặt
- ✅ Blog/Tin tức
- ✅ Responsive design

## Công nghệ sử dụng

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Query** - Data fetching và caching
- **Zustand** - State management
- **Axios** - HTTP client
- **Swiper** - Carousel/Slider
- **React Icons** - Icons
- **date-fns** - Date formatting

## Cài đặt

### Yêu cầu

- Node.js v18 trở lên
- npm hoặc yarn

### Các bước cài đặt

1. **Cài đặt dependencies:**

```bash
npm install
```

2. **Tạo file `.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Movie Booking
```

3. **Chạy ứng dụng:**

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3001`

## Cấu trúc thư mục

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Trang chủ
│   ├── movies/            # Trang phim
│   ├── cinemas/           # Trang rạp chiếu
│   ├── schedules/         # Trang lịch chiếu
│   ├── booking/           # Trang đặt vé
│   ├── login/             # Trang đăng nhập
│   ├── register/          # Trang đăng ký
│   ├── bookings/          # Trang vé của tôi
│   └── blog/              # Trang blog
├── components/            # Components
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── MovieCard.tsx
├── lib/                   # Utilities
│   └── api.ts            # API client
├── store/                 # State management
│   └── auth-store.ts
└── types/                 # TypeScript types
    └── index.ts
```

## Kết nối với Backend

Frontend kết nối với backend NestJS thông qua API. Đảm bảo backend đang chạy tại `http://localhost:3000` (hoặc cấu hình trong `.env.local`).

### API Endpoints

- `GET /movies` - Lấy danh sách phim
- `GET /movies/:id` - Lấy chi tiết phim
- `GET /cinemas` - Lấy danh sách rạp
- `GET /schedules` - Lấy lịch chiếu
- `POST /auth/login` - Đăng nhập
- `POST /auth/register` - Đăng ký
- `POST /bookings` - Đặt vé
- `GET /bookings` - Lấy danh sách vé
- `POST /bookings/:id/cancel` - Hủy vé
- `GET /blogs` - Lấy danh sách blog

## Tính năng chính

### Trang chủ

- Banner carousel với phim nổi bật
- Danh sách phim đang chiếu
- Quick booking links
- Blog section

### Phim

- Danh sách tất cả phim
- Tìm kiếm phim
- Chi tiết phim với:
  - Thông tin phim
  - Lịch chiếu
  - Đánh giá và bình luận

### Đặt vé

- Chọn phim và lịch chiếu
- Chọn ghế
- Xác nhận đặt vé
- Quản lý vé đã đặt

### Authentication

- Đăng ký tài khoản
- Đăng nhập
- Quản lý thông tin người dùng

## Development

### Chạy development server

```bash
npm run dev
```

### Build production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Movie Booking
```

## Lưu ý

1. **Backend API**: Đảm bảo backend NestJS đang chạy và có CORS được cấu hình đúng.

2. **Authentication**: Token được lưu trong cookie và tự động được thêm vào headers của mọi request.

3. **Responsive**: Website được thiết kế responsive, hỗ trợ mobile, tablet và desktop.

4. **Error Handling**: API errors được xử lý tự động, redirect về trang login nếu token hết hạn.

## Troubleshooting

### Lỗi kết nối API

- Kiểm tra backend đang chạy
- Kiểm tra `NEXT_PUBLIC_API_URL` trong `.env.local`
- Kiểm tra CORS configuration trong backend

### Lỗi authentication

- Kiểm tra token trong cookie
- Kiểm tra JWT_SECRET trong backend
- Clear cookies và đăng nhập lại

## License

MIT
