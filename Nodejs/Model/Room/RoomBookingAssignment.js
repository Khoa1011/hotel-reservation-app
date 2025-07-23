const mongoose = require('mongoose');

const RoomBookingAssignmentSchema = new mongoose.Schema({
    maPhong: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "phong",
        index: true
    },
    maDatPhong: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "donDatPhong",
        index: true
    },

    trangThaiGanPhong: {
        type: String,
        enum: [
            "chua_gan",
            "da_gan",           // Đã gán phòng
            "dang_cho_checkin", // Chờ khách check-in
            "da_checkin",       // Khách đã vào phòng
            "dang_su_dung",     // Đang sử dụng
            "da_checkout",      // Đã check-out
            "chuyen_phong",     // Chuyển phòng
            "nang_cap",         // Nâng cấp phòng
            "huy_gan"           // Hủy gán phòng
        ],
        default: "chua_gan",
        index: true
    },
    tang: Number,
    loaiView: String,

    ngayNhanPhongThucTe: {
        type: Date,
        default: null // Có thể khác với booking.ngayNhanPhong
    },

    ngayTraPhongThucTe: {
        type: Date,
        default: null // Có thể khác với booking.ngayTraPhong
    },

    gioNhanPhongThucTe: {
        type: String,
        default: null
    },

    gioTraPhongThucTe: {
        type: String,
        default: null
    },

    giaPhongGoc: {
        type: Number,
        default: 0,
        min: 0
    },

    giaPhongThucTe: {
        type: Number,
        default: 0,
        min: 0 
    },

    phuPhiNangCap: {
        type: Number,
        default: 0,
        min: 0
    },

    lyDoGanPhong: {
        type: String,
        enum: [
            "gan_binh_thuong",  // Gán bình thường
            "thay_the",         // Thay thế phòng khác  
            "nang_cap",         // Nâng cấp từ loại khác
            "yeu_cau_khach",    // Theo yêu cầu khách
            "van_de_ky_thuat",  // Do vấn đề kỹ thuật phòng cũ
            "free_upgrade"      // Free upgrade
        ],
        default: "gan_binh_thuong"
    },

    // Lưu thông tin phòng trước khi đổi
    ganPhongTruocDo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ganPhongBooking",
        default: null
    },

    //Nếu mỗi phòng mỗi khách khác nhau
    thongTinKhachPhong: {
        tenKhachChinh: String,      // Tên khách chính phòng này
        soDienThoaiLienHe: String,  // SĐT liên hệ riêng
        soLuongKhachThucTe: {       // Số khách thực tế vào phòng
            type: Number,
            min: 1
        },
        danhSachKhach: [{           // Danh sách khách trong phòng
            hoTen: String,
            cccd: String,
            quocTich: String,
            tuoi: Number
        }],
        yeuCauDacBiet: String       // Yêu cầu đặc biệt cho phòng này
    },

    dichVuSuDung: [{
        tenDichVu: String,
        soLuong: Number,
        donGia: Number,
        thanhTien: Number,
        thoiGianSuDung: Date
    }],

    tinhTrangPhong: {
        tinhTrangKhiNhan: {
            type: String,
            enum: ["tot", "binh_thuong", "can_sua_chua", "co_van_de"],
            default: "tot"
        },

        tinhTrangKhiTra: {
            type: String,
            enum: ["tot", "binh_thuong", "can_don_dep", "hu_hong", "mat_do"],
            default: "tot"
        },

        ghiChuTinhTrang: String,

        hinhAnhTinhTrang: [{
            url: String,
            moTa: String,
            thoiGian: Date
        }]
    },

    ghiChu: {
        type: String,
        default: ""
    },


    trangThaiHoatDong: {
        type: Boolean,
        default: true
    },

    lanCapNhatCuoi: {
        type: Date,
        default: Date.now
    },

}, {
    timestamps: true,
});

module.exports = mongoose.model("chiTietPhong", RoomBookingAssignmentSchema);
