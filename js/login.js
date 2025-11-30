// Đối tượng quản lý trang đăng nhập
const LoginManager = {
    // Khởi tạo
    init() {
        this.bindEvents();
        this.setupValidation();
    },

    // Gắn các sự kiện
    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        const modalOkBtn = document.getElementById('modalOkBtn');

        // Sự kiện submit form
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Sự kiện đóng modal
        modalOkBtn.addEventListener('click', () => this.hideModal());

        // Click outside modal để đóng
        document.getElementById('messageModal').addEventListener('click', (e) => {
            if (e.target.id === 'messageModal') {
                this.hideModal();
            }
        });

        // Xử lý phím ESC để đóng modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });

        // Auto format MSSV
        document.getElementById('studentId').addEventListener('input', this.formatStudentId);

        // Auto format lớp
        document.getElementById('className').addEventListener('input', this.formatClassName);

        // Auto format Room ID
        document.getElementById('roomId').addEventListener('input', this.formatRoomId);
    },

    // Thiết lập validation
    setupValidation() {
        const inputs = document.querySelectorAll('input[required]');
        inputs.forEach(input => {
            // Validation khi blur
            input.addEventListener('blur', (e) => this.validateField(e.target));
            
            // Clear error khi focus
            input.addEventListener('focus', (e) => this.clearError(e.target));
        });
    },

    // Format mã số sinh viên
    formatStudentId(e) {
        let value = e.target.value.replace(/\D/g, ''); // Chỉ giữ lại số
        if (value.length > 10) value = value.slice(0, 10); // Giới hạn 10 số
        e.target.value = value;
    },

    // Format tên lớp
    formatClassName(e) {
        let value = e.target.value.toUpperCase(); // Chuyển thành chữ hoa
        value = value.replace(/[^A-Z0-9]/g, ''); // Chỉ giữ chữ và số
        e.target.value = value;
    },

    // Format ID phòng
    formatRoomId(e) {
        let value = e.target.value.toUpperCase();
        value = value.replace(/[^A-Z0-9]/g, ''); // Chỉ giữ chữ và số
        e.target.value = value;
    },

    // Validate từng field
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        // Clear previous error
        this.clearError(field);

        // Kiểm tra trống
        if (!value) {
            errorMessage = 'Thông tin này không được để trống';
            isValid = false;
        } else {
            // Validate theo từng loại field
            switch (fieldName) {
                case 'fullname':
                    if (value.length < 2) {
                        errorMessage = 'Họ tên phải có ít nhất 2 ký tự';
                        isValid = false;
                    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) {
                        errorMessage = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
                        isValid = false;
                    }
                    break;

                case 'studentId':
                    if (!/^\d{8,10}$/.test(value)) {
                        errorMessage = 'MSSV phải có 8-10 chữ số';
                        isValid = false;
                    }
                    break;

                case 'className':
                    if (!/^[A-Z0-9]{3,10}$/.test(value)) {
                        errorMessage = 'Lớp phải có 3-10 ký tự (chữ hoa và số)';
                        isValid = false;
                    }
                    break;

                case 'roomId':
                    if (!/^[A-Z0-9]{2,8}$/.test(value)) {
                        errorMessage = 'ID phòng phải có 2-8 ký tự (chữ hoa và số)';
                        isValid = false;
                    }
                    break;
            }
        }

        if (!isValid) {
            this.showError(field, errorMessage);
        } else {
            this.showSuccess(field);
        }

        return isValid;
    },

    // Hiển thị lỗi
    showError(field, message) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.add('error');
        formGroup.classList.remove('success');

        // Tạo hoặc cập nhật thông báo lỗi
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        errorElement.textContent = message;
    },

    // Hiển thị thành công
    showSuccess(field) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.add('success');
        formGroup.classList.remove('error');
    },

    // Xóa lỗi
    clearError(field) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.remove('error', 'success');
        
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    },

    // Xử lý đăng nhập
    async handleLogin(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Validate tất cả các field
        let isFormValid = true;
        const requiredFields = ['fullname', 'studentId', 'className', 'roomId'];
        
        requiredFields.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showModal('⚠️ Thông tin không hợp lệ', 'Vui lòng kiểm tra lại các thông tin đã nhập và sửa các lỗi được hiển thị.');
            return;
        }

        // Hiển thị loading
        this.showLoading(true);

        try {
            // Giả lập kiểm tra thông tin với server
            await this.simulateLogin(data);

            // Lưu thông tin sinh viên vào localStorage
            localStorage.setItem('studentInfo', JSON.stringify({
                fullname: data.fullname.trim(),
                studentId: data.studentId.trim(),
                className: data.className.trim(),
                roomId: data.roomId.trim(),
                loginTime: new Date().toISOString()
            }));

            // Hiển thị thành công và chuyển trang
            this.showModal('✅ Đăng nhập thành công', 
                `Chào mừng ${data.fullname}!\n\nBạn sẽ được chuyển đến phòng thi trong giây lát...`,
                () => {
                    // Chuyển đến trang thi chính
                    window.location.href = 'index.html';
                }
            );

        } catch (error) {
            this.showModal('❌ Đăng nhập thất bại', error.message);
        } finally {
            this.showLoading(false);
        }
    },

    // Giả lập quá trình đăng nhập
    simulateLogin(data) {
        return new Promise((resolve, reject) => {
            // Giả lập độ trễ mạng
            setTimeout(() => {
                // Danh sách ID phòng hợp lệ (có thể mở rộng)
                const validRooms = ['A101', 'A102', 'B201', 'B202', 'C301', 'LAB1', 'LAB2'];
                
                if (!validRooms.includes(data.roomId)) {
                    reject(new Error(`ID phòng "${data.roomId}" không tồn tại hoặc chưa được kích hoạt.\n\nCác phòng thi hiện có: ${validRooms.join(', ')}`));
                    return;
                }

                // Kiểm tra MSSV (có thể thêm logic phức tạp hơn)
                if (data.studentId.startsWith('0000')) {
                    reject(new Error('MSSV không hợp lệ. Vui lòng liên hệ phòng đào tạo.'));
                    return;
                }

                // Thành công
                resolve();
            }, 1500);
        });
    },

    // Hiển thị/ẩn loading
    showLoading(show) {
        const loginBtn = document.querySelector('.login-btn');
        if (show) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    },

    // Hiển thị modal
    showModal(title, message, onClose = null) {
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOkBtn = document.getElementById('modalOkBtn');

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.style.display = 'block';

        // Thêm callback khi đóng modal
        if (onClose) {
            modalOkBtn.onclick = () => {
                this.hideModal();
                onClose();
            };
        } else {
            modalOkBtn.onclick = () => this.hideModal();
        }

        // Focus vào nút OK
        setTimeout(() => modalOkBtn.focus(), 100);
    },

    // Ẩn modal
    hideModal() {
        const modal = document.getElementById('messageModal');
        modal.style.display = 'none';
    }
};

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    LoginManager.init();

    // Kiểm tra nếu đã đăng nhập trước đó
    const savedInfo = localStorage.getItem('studentInfo');
    if (savedInfo) {
        const studentData = JSON.parse(savedInfo);
        const loginTime = new Date(studentData.loginTime);
        const now = new Date();
        const diffHours = (now - loginTime) / (1000 * 60 * 60);

        // Nếu đã đăng nhập trong vòng 24h thì tự động điền form
        if (diffHours < 24) {
            document.getElementById('fullname').value = studentData.fullname;
            document.getElementById('studentId').value = studentData.studentId;
            document.getElementById('className').value = studentData.className;
            document.getElementById('roomId').value = studentData.roomId;
        }
    }
});