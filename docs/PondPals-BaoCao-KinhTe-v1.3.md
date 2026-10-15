# Pond Pals – Báo cáo test kinh tế và nhịp chơi đầu game (v1.3)

Ngày 15/10/2026. Game #3, route A (Poki).

## 1. Cách test

- **Mô phỏng người chơi** (`tools/econ.ts`): 150 lượt × 3 kiểu người chơi, mỗi lượt 60 phút. Mỗi kiểu có phản xạ, độ "nóng tay" khi thấy cá rỉa mồi, độ trễ khi kéo dây, thời gian đọc thẻ và mở menu, và khoảng nghỉ riêng.
  - **Mới chơi**: phản xạ 0,38–0,83 s; 35% bấm nhầm khi cá rỉa mồi.
  - **Trung bình**: phản xạ 0,30–0,60 s; 18% bấm nhầm.
  - **Giỏi**: phản xạ 0,22–0,40 s; 6% bấm nhầm.
  - Trong lúc để dành xu mở hồ mới, người chơi vẫn mua các nâng cấp rẻ mà nút đang sáng (dưới 6% giá hồ).
- **Đấu boss** (`tools/bosstest.ts`): 300 trận cho mỗi tổ hợp kiểu người chơi × hồ, với cấp đồ đúng lúc gặp boss ở hồ đó.
- **Chạy thật trong trình duyệt** (Chromium headless):
  - `play.mjs` chơi 90–120 giây bằng chuột thật.
  - `panels.mjs` mở mọi bảng.
  - Kịch bản thua/thắng boss, nhận thưởng offline và đổi ngôn ngữ.
  - SDK Poki giả để ghi lại thứ tự sự kiện.
  - Một bot trong trang đánh hết trận boss ở hồ 1 và hồ 3, ở cả màn dọc và màn ngang.
- **Kiểm tra code và build**:
  - Typecheck sạch.
  - 14 test logic và đối chiếu bản dịch, 10 test core.
  - Build Poki 2,16 MB, check-build OK.
  - Không có lỗi console.

**Giới hạn:** đây là mô hình, không phải người thật. Số liệu dùng để so sánh trước/sau và phát hiện điểm nghẽn. Chỉ số thật phải đợi Player Fit Test.

## 2. Vấn đề tìm thấy ở v1.2

| Vấn đề | Số đo v1.2 | Vì sao nguy hiểm |
| --- | --- | --- |
| Người mới hỏng nhiều ở mấy lượt quăng đầu | Hỏng 46% trong 3 lượt đầu, 53% trong 10 lượt đầu; 27% lượt câu bị trượt vì cửa sổ cắn câu chỉ 0,6 s | Người chơi Poki thoát ngay trong phút đầu nếu thấy khó. Đây là rủi ro lớn nhất cho Player Fit Test. |
| Thưa phần thưởng lớn | Phút 0–10: 29–39 thưởng lớn; khoảng trống dài nhất 78–95 s (p90 lên đến 170 s) | Khoảng "chán" dài hơn 1 phút trong 10 phút đầu thì nhiều người rời đi |
| Vùng trũng phút 5–15 | Sau khi hạ boss 1, cả game chỉ còn mục tiêu để dành 2.000 xu | Không có mục tiêu ngắn hạn, không có lý do để quăng thêm một lượt nữa |
| Boss quá dễ, không có kỹ năng | Thắng gần 100%, mỗi trận 75–96 s chỉ để giữ thanh | Trận boss dài và nhàm, không tạo khoảnh khắc đáng nhớ |
| Nhịp mở hồ | Người mới mở hồ 2 ở phút 21; chỉ 28% hạ được boss cuối trong 60 phút | Người mới không thấy được nội dung mới |

## 3. Đã sửa và bổ sung trong game

**Phút đầu dễ hơn (15 lượt câu đầu):**
- Bấm sớm lúc cá rỉa mồi không làm mất cá nữa. Game nhắc "Chưa đâu! Đợi tiếng bõm lớn".
- Bỏ lỡ lần cắn câu thì cá cắn lại thêm một lần nữa.
- Cửa sổ cắn câu được nới thêm 0,35 s.
- Cửa sổ cắn câu gốc tăng từ 0,6 lên 0,75 s cho mọi người (tối đa 1,1 s khi nâng phao).

**Cá TRUY NÃ:**
- Cứ 6 con cá lại có một tấm poster "WANTED" cho một loài: 50% thường, 35% không thường, 15% hiếm.
- Câu được con đó thì nhận ×3 giá cá + 40 × hệ số hồ, kèm thẻ "WANTED!".
- Mỗi lượt quăng có 18% cơ hội loài truy nã xuất hiện.
- Poster nằm ở đầu màn hình. Loài chưa gặp hiện dạng bóng.

**Chuỗi hoàn hảo:**
- Mỗi cú móc đúng nhịp liên tiếp được +10% giá cá, tối đa +50%.
- Hỏng một lượt thì mất chuỗi.

**Thanh mục tiêu kế tiếp** (luôn hiện dưới ô xu):
- "Sổ cá 5/7 » Boss", rồi "Hồ X đã mở! » Bản đồ", rồi "Hồ X 3/8".
- Người chơi luôn biết việc tiếp theo cần làm.

**Boss có kỹ năng:**
- Trước mỗi cú giật, cá quẫy: phao nảy, nước bắn và thanh nháy cam "LET GO!".
- Nhả tay kịp thì chỉ chịu 30% lực giật.
- Dây mòn dần mỗi khi ở vùng đỏ. Nâng cấp Dây giúp chịu lâu hơn.
- Boss hồ sau mạnh hơn một chút, nhưng đồ của người chơi cũng tốt hơn.

**Nhịp mở hồ:** giá mở hồ Misty 2.000 → 1.500 xu, Frozen 14.000 → 18.000 xu.

**Giao diện:**
- Ở màn dọc, poster TRUY NÃ và thanh mục tiêu được thu nhỏ để không đè nút bên.
- Ở màn ngang, cả hàng hạ xuống một chút để không chạm chip "Lucky cast".

Toàn bộ chữ mới đã có đủ 6 ngôn ngữ (en, fr, de, es, it, tr).

## 4. Chỉ số kinh tế v1.3 (trung vị 150 lượt)

### Mốc tiến trình (phút)

| Mốc | Mới chơi | Trung bình | Giỏi |
| --- | --- | --- | --- |
| Cá đầu tiên | 0,1 | 0,1 | 0,1 |
| Trứng đầu tiên | 0,3 | 0,3 | 0,3 |
| Nâng cấp đầu tiên | 0,4 | 0,4 | 0,4 |
| Nở thú đầu tiên | 0,8 | 0,8 | 0,7 |
| Rương đầu tiên | 3,2 | 2,4 | 2,3 |
| Hạ boss 1 (Old Whiskers) | 4,1 | 3,4 | 3,1 |
| Mở hồ 2 (Misty Creek) | 15,6 | 12,7 | 9,7 |
| Hạ boss 2 | 20,5 | 17,1 | 13,4 |
| Mở hồ 3 (Frozen Lake) | 42,7 | 34,2 | 26,9 |
| Hạ boss cuối | 49,8 | 42,1 | 34,4 |
| Hạ boss cuối trong 60 phút | 81% | 96% | 98% |

So với v1.2 ở người mới: hồ 2 đến sớm hơn 5 phút (20,8 → 15,6), và tỉ lệ hạ boss cuối trong 60 phút tăng từ 28% lên 81%.

### Thu nhập xu (người chơi trung bình)

| Khoảng | Tổng xu kiếm được | Xu/phút |
| --- | --- | --- |
| 0–5 phút | 1.036 | 207 |
| 5–10 phút | 2.354 | 258 |
| 15–20 phút (hồ 2, giá ×3) | 9.192 | 912 |
| 25–30 phút | 19.453 | 1.046 |
| 40–45 phút (hồ 3, giá ×9) | 56.192 | 3.159 |
| 55–60 phút | 104.945 | 3.148 |

- Giá nâng cấp tăng ×1,15 mỗi cấp, từ 20–50 xu.
- Giá nâng cấp rẻ nhất tăng từ 30 xu ở phút 1 lên 92 xu ở phút 10.
  - Mỗi phút vẫn mua được 1–3 nâng cấp, đúng nhịp "luôn có thứ để mua".
- Chỉ có một loại tiền (xu). Không có đường tắt trả phí.

### Hành động trong 10 phút đầu (người chơi trung bình, mỗi phút)

| Phút | Lượt quăng | Lượt bấm/giữ | Thưởng lớn | Xu |
| --- | --- | --- | --- | --- |
| 1 | 6 | 23 | 9 | 80 |
| 2 | 6 | 22 | 8 | 145 |
| 3 (boss 1) | 4 | 32 | 7 | 161 |
| 4 | 5 | 24 | 9 | 350 |
| 5 | 7 | 22 | 6 | 243 |
| 6 | 7 | 22 | 6 | 237 |
| 7 | 7 | 22 | 5 | 200 |
| 8 | 8 | 23 | 4 | 215 |
| 9 | 8 | 25 | 3 | 258 |
| 10 | 9 | 25 | 4 | 340 |

- "Lượt bấm/giữ" chỉ đếm thao tác câu cá, chưa tính bấm menu, nở trứng hay đóng thẻ.
- Tính cả các thao tác đó thì người chơi có khoảng 25–35 thao tác mỗi phút, tức một thao tác mỗi 2–3 giây.
- "Thưởng lớn" gồm: loài mới, trứng, rương, nở/lên cấp thú, nâng cấp, nhận nhiệm vụ, cá TRUY NÃ, boss, hồ mới.

### So sánh trước và sau

| Chỉ số | v1.2 mới / TB / giỏi | v1.3 mới / TB / giỏi |
| --- | --- | --- |
| Hỏng trong 3 lượt đầu | 46% / 22% / 9% | 0% / 0% / 0% |
| Hỏng trong 10 lượt đầu | 53% / 18% / 9% | 0,2% / 0,2% / 0,1% |
| Thưởng lớn trong 3 phút đầu | 13 / 19 / 20 | 21 / 25 / 28 |
| Thưởng lớn trong 10 phút đầu | 29 / 33 / 39 | 56 / 62 / 71 |
| Khoảng trống dài nhất không có thưởng lớn, 10 phút đầu (trung vị) | 95 / 88 / 78 s | 53 / 50 / 51 s |
| Khoảng trống trên, nhưng p90 | 135 / 124 / 169 s | 77 / 79 / 76 s |
| Boss: thắng ngay lần đầu | khoảng 100% | hồ 1: 81 / 87 / 79%; hồ 2: 90 / 90 / 84%; hồ 3: 91 / 93 / 83% |
| Boss: thời lượng trận | 75–96 s | 25–41 s |

## 5. Đánh giá theo yêu cầu xét duyệt của Poki

| Tiêu chí | Yêu cầu | Pond Pals v1.3 | Kết luận |
| --- | --- | --- | --- |
| Vào chơi tức thì | Không có màn chặn, chạm là chơi | Chạm đầu tiên là quăng câu; `gameplayStart` gửi ở chạm đầu | Đạt |
| Phút đầu dễ hiểu | Thắng ngay, hướng dẫn ít chữ | Cá đầu tiên ở giây thứ 3–4, không ai hỏng 3 lượt đầu, hướng dẫn 3–6 chữ | Đạt |
| Đủ hành động | Luôn có việc làm, không chờ | 6–9 lượt quăng và 25–35 thao tác mỗi phút; không có thời gian chờ bắt buộc | Đạt |
| Nhịp thưởng | Thưởng đều, có mục tiêu | 3 phút đầu: một thưởng lớn mỗi 7–9 s; phút 5–10: mỗi 10–20 s; khoảng trống dài nhất khoảng 50 s; luôn có mục tiêu kế tiếp | Đạt |
| Player Fit Test | Thời gian chơi trung bình > 3 phút và ≥ 25% lượt > 3 phút | Boss 1 rơi vào phút 3–4, hồ 2 khoảng phút 13; ở mốc 3 phút người chơi vừa có thú, đang sắp gặp boss | Khả năng qua cao. Mục tiêu thật là trung bình ≥ 5 phút. |
| Web Fit Test | C2P ≥ 65%, CTR và thời gian chơi so với thể loại | Build 2,16 MB, tải nhanh; vào game bằng 1 chạm. CTR phụ thuộc thumbnail. | C2P nhiều khả năng đạt. CTR chưa đo được. |
| Quảng cáo đúng luật | Không hẹn giờ, nút thưởng không xanh lá | Đúng (đã kiểm ở mục 13 của hướng dẫn) | Đạt |

## 6. Khả năng giữ chân người chơi (retention)

Có cho cả 3 tầng:

- **Trong phiên (5–50 phút):**
  - Vòng câu → trứng → nở thú → nâng cấp → boss → hồ mới.
  - Có thêm cá TRUY NÃ, chuỗi hoàn hảo và thanh mục tiêu.
  - Nội dung khoảng 45–50 phút: 3 hồ, 24 loài cá, 15 thú, 3 boss.
- **Quay lại trong ngày:**
  - Trứng hiếm nở lâu (vài phút).
  - Thú câu hộ khi offline: 50%, tối đa 2 giờ, có nút x2 thưởng.
  - Nhiệm vụ trong ngày.
- **Quay lại hôm sau:**
  - Quà điểm danh theo chuỗi ngày.
  - Nhiệm vụ mới mỗi ngày.
  - Sổ cá và bộ sưu tập thú (có bản shiny) chưa đầy.

Rủi ro còn lại:

1. **Sau boss cuối (khoảng phút 42–50) hết mục tiêu lớn.** Chỉ còn sưu tập thú/shiny và nâng cấp. Người chơi cày lâu sẽ dừng ở đây.
   - Đề xuất cho v1.4, trước Soft Release: hồ 4 "Coral Cove" (đã có biển báo "sắp ra mắt"), hoặc chế độ "boss khó hơn" có phần thưởng thú hiếm.
2. **Khoảng phút 20–34 (để dành 18.000 xu cho hồ 3).** Nhịp vẫn có thưởng nhỏ đều (khoảng trống dài nhất trong 30 phút đầu là 62–75 s), nhưng mục tiêu lớn xa.
   - Theo dõi chỉ số thật. Nếu tụt ở đoạn này thì hạ giá hồ 3 hoặc thêm một mốc giữa, ví dụ nhiệm vụ "hạ boss hồ 2 lần nữa".
3. **Số liệu là mô phỏng.** Người thật đọc chậm hơn, mở menu nhiều hơn và thoát vì lý do khác.
   - Thử thêm với 3–5 người thật trên điện thoại (bản test riêng tư) trước khi nộp.

## 7. Kết luận

- **Phút đầu:** đã sửa điểm yếu lớn nhất (người mới hỏng hơn một nửa số lượt đầu).
  - Lượt thao tác và nhịp thưởng ở 10 phút đầu nay ở mức thường thấy của game idle/casual bán chạy trên Poki: một thao tác mỗi 2–3 s, một thưởng lớn mỗi khoảng 7–20 s.
- **Player Fit Test:** khả năng qua mốc trung bình > 3 phút là cao, vì mốc hấp dẫn nhất (boss đầu) rơi đúng phút 3–4 và hồ mới mở quanh phút 13.
- **Retention:** đủ móc để qua giai đoạn test (Player/Web Fit Test chủ yếu đo phiên đầu).
  - Cần thêm nội dung sau boss cuối trước Soft Release để giữ người chơi ngày 2 trở đi.

Phiên bản: v1.3, commit `55eb80f`.
