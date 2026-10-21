# Bộ hồ sơ nộp Poki: Player Fit Test

Dùng cho game #3 (bản v1.12). Nội dung bên dưới dán thẳng vào P4D (app.poki.dev). Các trường tiếng Anh để nguyên, vì Poki tự viết lại mô tả chuẩn SEO.

**Trước khi tạo game trên P4D phải đổi tên.** "Pond Pals" trùng tên game của HyperBeard (Google Play, 5/2026). Chỗ nào có `[NEW NAME]` thì thay bằng tên mới. Khi đổi tên trong code, sửa `src/game.json` (`title`) và `<title>` trong `index.html`. Giữ nguyên `id` (`pondpals`): đó là khóa lưu tiến trình, người chơi không thấy.

## 1. Các bước tới Player Fit Test

| Bước | Việc làm | Xong khi |
| --- | --- | --- |
| 1 | Tạo game trên P4D với tên mới; upload `builds/PondPals_Poki_v1.12.zip` (đổi tên file sau) | Qua content moderation (vài giờ) |
| 2 | Chạy Playtest, xem đủ 10 video | Mở khóa Player Fit Test |
| 3 | Điền phần "Game page" (mục 2) và upload thumbnail (mục 3) | Đủ điều kiện chạy test |
| 4 | Chạy Player Fit Test (500 người, khoảng 5 giờ, tối đa 2 lần/ngày) | Trung bình > 3 phút và ≥ 25% lượt > 3 phút |
| 5 | Đọc kết quả theo mục 5; sửa một chỉ số yếu nhất rồi chạy lại | Đạt ngưỡng thì sang Web Fit Test |

Trước bước 1, tự chơi bản điện thoại 15–20 phút và chạy Poki Inspector (inspector.poki.dev): QR test, Scaling Tests, bật chặn quảng cáo thật, xem Event Log.

## 2. Thông tin trang game (dán vào P4D)

**Name:** `[NEW NAME]`

**Mobile orientation:** Both (portrait and landscape). Game hỗ trợ cả hai, dọc là chính.

**Suggested categories (tối đa 4):** Fishing, Cat, Animal, Casual. Chọn đúng tên trong danh sách thả xuống của P4D; nếu thiếu mục nào thì thay bằng Idle hoặc Collecting.

**Short description:**

> Cast, catch and hatch! Fish with a cozy cat, fill your Fishdex, hatch eggs into helpful pond pets and reel in giant boss fish across three ponds.

**How to play / controls:**

> Hold and release to cast. Tap when the bobber dips. Hold to reel and keep the marker in the green; let go when the fish thrashes. Works with mouse, touch or the Space bar. ESC pauses.

**What makes it different (cho phần mô tả cơ chế):**

> A fishing game with a pet-collecting heart: every egg you fish up hatches into a pond pal with its own perk (luck, faster eggs, better prices, fishing helpers). Three ponds with 36 fish to discover, a boss at the end of each pond, boss rematches in four special forms (Frenzy, Ghost, Giant, Golden), 24 timed challenges, medals and a wardrobe for the cat. One currency, progress saves automatically.

**Roadmap (Poki thích game có đất để lớn):**

> Next: a fourth pond (Coral Cove, tropical fish and a crab boss), seasonal fish, more pets and challenge levels, and online leaderboards for challenge times.

## 3. Thumbnail

| File | Dùng cho | Trạng thái |
| --- | --- | --- |
| `store/thumbnail_1024.png` | Thumbnail tĩnh (upload bản này) | Có: 1024×1024, không chữ, nền hoàng hôn ấm, xa màu nền Poki `#83FFE7` |
| `store/thumbnail_628.png` | Bản dự phòng kích thước tối thiểu | Có |
| Thumbnail động `.mp4` | Bắt buộc trước Global Release | Chưa làm (1080×1080, ≥ 50 fps, 4–6 s) |

Thumbnail không có chữ nên đổi tên game không phải làm lại.

## 4. Game gửi gì cho Poki (để đọc kết quả test)

**Sự kiện SDK:** `gameLoadingFinished` khi tải xong. `gameplayStart` ở lần chạm đầu. Mỗi lần mở bảng, pause hoặc màn kết quả: `gameplayStop`, khi quay lại thì `commercialBreak` rồi `gameplayStart`. Quảng cáo thưởng (`rewardedBreak`) chỉ khi người chơi tự bấm nút tím có biểu tượng 🎬.

**Sự kiện phễu `PokiSDK.measure` (mới ở v1.12):**

| category | what | action | Khi nào |
| --- | --- | --- | --- |
| tutorial | cast, bite, reel, egg, hatch, upgrade, boss | complete | Xong từng bước hướng dẫn (một lần mỗi người chơi) |
| tutorial | all | complete | Xong cả 6 bước chính |
| boss | old_whiskers, fog_pike, frostbeard | start / win / lose | Trận boss đầu tiên của mỗi hồ |
| rematch | `<boss>-star<n>` | start / win / lose | Đấu lại boss theo sao |
| pond | misty, frozen | unlock | Mở hồ mới |
| daily | day1, day2, … | claim | Nhận quà đăng nhập (số ngày liên tiếp) |
| challenge | `cozy-1` … `frozen-8` | clear / fail | Kết thúc một màn thử thách |

## 5. Đọc kết quả Player Fit Test

Theo mô phỏng (3 kiểu người chơi, 150 lượt mỗi kiểu):

| Mốc | Thời điểm | Sự kiện tương ứng |
| --- | --- | --- |
| Cá đầu tiên | khoảng 3 giây | tutorial / reel / complete |
| Trứng, nâng cấp, nở pet đầu tiên | 16–50 giây | tutorial / egg, upgrade, hatch |
| Boss Cozy Pond | 2,6–4,4 phút | boss / old_whiskers / start, win |
| Mở Misty Creek | 12–18 phút | pond / misty / unlock |

**Cách đọc:**

| Biểu đồ thời gian chơi | Nhìn vào | Hướng sửa |
| --- | --- | --- |
| Nhiều lượt dưới 1 phút | Tỉ lệ `tutorial cast` trên số người vào game; video Playtest đoạn 20 giây đầu | Hướng dẫn quăng cần, tốc độ tải |
| Rơi ở 3–5 phút | Tỉ lệ `boss old_whiskers lose` trên `start` | Boss đầu đã giảm còn hồi 10%; nếu vẫn thua nhiều, giảm `BOSS.misHealFirst` hoặc tăng `misGrace` trong `src/logic/fishing.ts` |
| Rơi ở 5–12 phút | Số người đạt `pond misty unlock` | Giá mở Misty (1.500 xu) hoặc thưởng nhiệm vụ |
| Trung bình trên 3 phút nhưng dưới 25% lượt vượt 3 phút | Phân bố bị lệch trái | Ấn tượng đầu: thumbnail, 10 giây đầu |

Mỗi lần chỉ sửa một chỉ số rồi chạy lại test.
