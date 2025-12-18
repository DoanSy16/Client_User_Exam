app.controller("LoginCtrl", function ($scope, $timeout, $window, SocketService) {
    vm = this;

    // Khởi tạo dữ liệu
    vm.formData = {
        fullname: '',
        studentId: '',
        className: '',
        roomId: ''
    };

    vm.errors = {};
    vm.validFields = {};
    vm.isLoading = false;

    vm.modal = {
        show: false,
        title: '',
        message: '',
        onClose: null,
        showButton: false,
        type: 'text'
    };
    // Danh sách phòng thi hợp lệ
    vm.validRooms = ['A101', 'A102', 'B201', 'B202', 'C301', 'LAB1', 'LAB2'];

    // Các phương thức public
    vm.handleLogin = handleLogin;
    vm.validateField = validateField;
    vm.clearError = clearError;
    vm.showError = showError;
    vm.showSuccess = showSuccess;
    vm.formatStudentId = formatStudentId;
    vm.formatClassName = formatClassName;
    vm.formatRoomId = formatRoomId;
    vm.showModal = showModal;
    vm.hideModal = hideModal;

    // Khởi tạo
    init();

    $scope.$on("SHOW_USER_MARK", function (event, data_user) {
        let js =JSON.parse(data_user);
        showModal(`${js.fullname} - ${js.user_code} - ${js.class}:`, js.mark, null, true, 'mark');
    });

    function init() {
        loadSavedInfo();
        angular.element($window).on('keydown', function (e) {
            if (e.key === 'Escape' && vm.modal.show) {
                vm.hideModal();
                vm.$apply();
            }
        });
    }

    SocketService.on("error", function (msg) {
        showModal('⚠️ Lỗi đăng nhập', msg);
        // localStorage.clear();
        return
    });

    SocketService.on("error_user_login", function (msg) {
        showModal('⚠️ Lỗi đăng nhập', msg, null, true);
        return
    });

function initScratchCard() {
    const canvas = document.getElementById("scratchCanvas");
    const ctx = canvas.getContext("2d");

    const markText = document.getElementById("markText");
    const wrapper = document.querySelector(".scratch-wrapper");

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    /*  LỚP BẠC ÁNH KIM */
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#D9D9D9");
    gradient.addColorStop(0.3, "#C0C0C0");
    gradient.addColorStop(0.6, "#ECECEC");
    gradient.addColorStop(1, "#BFBFBF");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let isDown = false;
    let totalCleared = 0;

    canvas.addEventListener("pointerdown", () => {
        isDown = true;

        /* RUNG NHẸ KHI BẮT ĐẦU CÀO */
        canvas.classList.add("scratch-shake");
        setTimeout(() => canvas.classList.remove("scratch-shake"), 300);

        canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointerup", () => {
        isDown = false;
    });

    canvas.addEventListener("pointermove", (event) => {
        if (!isDown) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        ctx.globalCompositeOperation = "destination-out";

        /* Vùng cào (hình tròn mềm 24px) */
        const size = 24;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        /* BỤI CÀO BAY */
        createScratchDust(x, y, wrapper);

        checkAutoReveal();
    });

    /* TỰ ĐỘNG MỞ SAU 60% */
    function checkAutoReveal() {
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let cleared = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] === 0) cleared++;
        }

        const percent = (cleared / (pixels.length / 4)) * 100;

        if (percent > 60) {
            revealAll();
        }
    }

    function revealAll() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    /* 💨 Tạo bụi cào */
    function createScratchDust(x, y, container) {
        const dust = document.createElement("div");
        dust.className = "scratch-dust";
        dust.style.left = x + "px";
        dust.style.top = y + "px";

        container.appendChild(dust);

        setTimeout(() => {
            dust.remove();
        }, 700);
    }
}



    function loadSavedInfo() {
        try {
            var savedInfo = localStorage.getItem('studentInfo');
            if (savedInfo) {
                var studentData = JSON.parse(savedInfo);
                var loginTime = new Date(studentData.loginTime);
                var now = new Date();
                var diffHours = (now - loginTime) / (1000 * 60 * 60);

                // Nếu đã đăng nhập trong vòng 24h thì tự động điền form
                if (diffHours < 24) {
                    vm.formData.fullname = studentData.fullname || '';
                    vm.formData.studentId = studentData.studentId || '';
                    vm.formData.className = studentData.className || '';
                    vm.formData.roomId = studentData.roomId || '';
                }
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin đã lưu:', error);
        }
    }

    function handleLogin() {

        // Reset errors
        vm.errors = {};
        vm.validFields = {};

        // Validate tất cả các field
        var isFormValid = true;
        var requiredFields = ['fullname', 'studentId', 'className', 'roomId'];

        requiredFields.forEach(function (fieldName) {
            if (!validateField(fieldName)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            showModal('⚠️ Thông tin không hợp lệ',
                'Vui lòng kiểm tra lại các thông tin đã nhập và sửa các lỗi được hiển thị.');
            return;
        }

        // Hiển thị loading
        vm.isLoading = true;
        localStorage.clear();
        // Giả lập quá trình đăng nhập
        simulateLogin()
            .then(function () {

                saveStudentInfo();
                // Hiển thị thành công và chuyển trang
                // showModal('✅ Đăng nhập thành công',
                //     'Chào mừng ' + vm.formData.fullname + '!\n\nBạn sẽ được chuyển đến phòng thi trong giây lát...',
                //     function () {
                //         // Chuyển đến trang thi chính
                //         // $window.location.href = 'exam.html';
                //     }
                // );
            })
            .catch(function (error) {
                showModal('❌ Đăng nhập thất bại', error);
            })
            .finally(function () {
                vm.isLoading = false;
            });
    }

    function simulateLogin() {
        return new Promise(function (resolve, reject) {
            $timeout(function () {
                const data = {
                    roomId: vm.formData.roomId.trim(),
                    userId: vm.formData.studentId.trim(),
                    name: vm.formData.fullname.trim(),
                    className: vm.formData.className.trim()
                }
                SocketService.emit("joinRoom", data);
                resolve();
            }, 1500);
        });
    }

    function saveStudentInfo() {
        try {

            var studentInfo = {
                fullname: vm.formData.fullname.trim(),
                studentId: vm.formData.studentId.trim(),
                className: vm.formData.className.trim(),
                roomId: vm.formData.roomId.trim(),
                loginTime: new Date().toISOString()
            };

            localStorage.setItem('studentInfo', JSON.stringify(studentInfo));
            if (localStorage.getItem('data_exam_questions'))
                $window.location.href = '#!quizView';
        } catch (error) {
            console.error('Lỗi khi lưu thông tin sinh viên:', error);
        }
    }

    function validateField(fieldName) {
        var value = vm.formData[fieldName] ? vm.formData[fieldName].trim() : '';
        var isValid = true;
        var errorMessage = '';

        // Clear previous error
        delete vm.errors[fieldName];
        delete vm.validFields[fieldName];

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
            }
        }

        if (!isValid) {
            vm.errors[fieldName] = errorMessage;
        } else {
            vm.validFields[fieldName] = true;
        }

        return isValid;
    }

    function clearError(fieldName) {
        delete vm.errors[fieldName];
        delete vm.validFields[fieldName];
    }

    function showError(fieldName) {
        return !!vm.errors[fieldName];
    }

    function showSuccess(fieldName) {
        return !!vm.validFields[fieldName];
    }

    function formatStudentId() {
        if (vm.formData.studentId) {
            var value = vm.formData.studentId.toUpperCase(); // Chỉ giữ lại số
            vm.formData.studentId = value;
        }
    }

    function formatClassName() {
        if (vm.formData.className) {
            var value = vm.formData.className.toUpperCase();
            vm.formData.className = value;
        }
    }

    function formatRoomId() {
        if (vm.formData.roomId) {
            var value = vm.formData.roomId;
            vm.formData.roomId = value;
        }
    }

    function showModal(title, message, onClose, showButton, type) {
        vm.modal = {
            show: true,
            title: title,
            message: message,
            onClose: onClose || null,
            showButton: showButton || false,
            type: type || 'text'
        };
        if (vm.modal.type === "mark") {
            $timeout(initScratchCard, 100);
        }
    }

    function hideModal() {
        var onClose = vm.modal.onClose;
        vm.modal = {
            show: false,
            title: '',
            message: '',
            onClose: null,
            showButton: false,
            type: 'text'
        };

        if (onClose && typeof onClose === 'function') {
            $timeout(onClose, 100);
        }
    }

    // Promise polyfill cho AngularJS
    function Promise(executor) {
        var self = this;
        self.state = 'pending';
        self.value = undefined;
        self.handlers = [];

        function resolve(result) {
            if (self.state === 'pending') {
                self.state = 'fulfilled';
                self.value = result;
                self.handlers.forEach(handle);
                self.handlers = null;
            }
        }

        function reject(error) {
            if (self.state === 'pending') {
                self.state = 'rejected';
                self.value = error;
                self.handlers.forEach(handle);
                self.handlers = null;
            }
        }

        function handle(handler) {
            if (self.state === 'pending') {
                self.handlers.push(handler);
            } else {
                if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
                    handler.onFulfilled(self.value);
                }
                if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
                    handler.onRejected(self.value);
                }
            }
        }

        this.then = function (onFulfilled, onRejected) {
            return new Promise(function (resolve, reject) {
                handle({
                    onFulfilled: function (result) {
                        try {
                            if (typeof onFulfilled === 'function') {
                                resolve(onFulfilled(result));
                            } else {
                                resolve(result);
                            }
                        } catch (ex) {
                            reject(ex);
                        }
                    },
                    onRejected: function (error) {
                        try {
                            if (typeof onRejected === 'function') {
                                resolve(onRejected(error));
                            } else {
                                reject(error);
                            }
                        } catch (ex) {
                            reject(ex);
                        }
                    }
                });
            });
        };

        this.catch = function (onRejected) {
            return this.then(null, onRejected);
        };

        this.finally = function (onFinally) {
            return this.then(
                function (result) {
                    if (typeof onFinally === 'function') {
                        onFinally();
                    }
                    return result;
                },
                function (error) {
                    if (typeof onFinally === 'function') {
                        onFinally();
                    }
                    throw error;
                }
            );
        };

        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }
});
