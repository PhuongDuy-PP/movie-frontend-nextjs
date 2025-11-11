# Quick Start - Frontend Movie Booking

## Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
cd frontend-movie-nextjs
npm install
```

### 2. Cấu hình environment

Tạo file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Movie Booking
```

### 3. Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3001`

## Đảm bảo Backend đang chạy

Frontend cần backend NestJS đang chạy tại `http://localhost:3000`. Nếu backend chạy ở port khác, cập nhật `NEXT_PUBLIC_API_URL` trong `.env.local`.

## Tính năng

### Trang chủ
- Banner carousel với phim nổi bật
- Danh sách phim đang chiếu
- Quick booking links
- Blog section

### Phim
- `/movies` - Danh sách phim
- `/movies/[id]` - Chi tiết phim với lịch chiếu và đánh giá

### Rạp chiếu
- `/cinemas` - Danh sách rạp chiếu

### Lịch chiếu
- `/schedules` - Lịch chiếu phim (có thể filter theo phim hoặc rạp)

### Đặt vé
- `/booking?scheduleId=xxx` - Đặt vé với chọn ghế

### Authentication
- `/login` - Đăng nhập
- `/register` - Đăng ký

### Quản lý vé
- `/bookings` - Xem và quản lý vé đã đặt

### Blog
- `/blog` - Danh sách blog/tin tức

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

## Troubleshooting

### Lỗi kết nối API

1. Kiểm tra backend đang chạy tại `http://localhost:3000`
2. Kiểm tra CORS configuration trong backend
3. Kiểm tra `NEXT_PUBLIC_API_URL` trong `.env.local`

### Lỗi authentication

1. Clear cookies và đăng nhập lại
2. Kiểm tra JWT token trong cookie
3. Kiểm tra JWT_SECRET trong backend

### Lỗi build

1. Xóa `.next` folder và build lại
2. Kiểm tra TypeScript errors
3. Kiểm tra dependencies đã được cài đặt đầy đủ

## Next Steps

1. Tạo tài khoản admin trong backend
2. Thêm dữ liệu phim, rạp, lịch chiếu
3. Test các tính năng đặt vé
4. Customize styling theo nhu cầu

