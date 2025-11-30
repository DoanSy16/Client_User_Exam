class ExamManagementSystem {
    constructor() {
        this.currentView = 'home';
        this.sampleData = this.generateSampleData();
        this.selectedQuestions = new Set();
        this.currentQuestion = {
            id: null,
            content: '',
            answers: [],
            correctAnswer: 'A',
            difficulty: 'Dễ',
            images: []
        };
        this.maxImages = 6;
        this.isEditing = false;
        this.notifications = this.generateNotifications();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateData();
        this.setupInputControls();
        this.setupMobileMenu();
        this.setupImageUpload();
        this.setupQuestionForm();
        this.setupNotifications();
        this.setupProfileModal();
        this.updateQuestionCountConstraints();
    }

    generateNotifications() {
        return [
            {
                id: 1,
                title: 'Sinh viên nộp bài',
                message: 'Nguyễn Văn A đã nộp bài thi Hệ điều hành',
                time: '5 phút trước',
                read: false,
                type: 'success'
            },
            {
                id: 2,
                title: 'Cảnh báo hệ thống',
                message: 'Máy PC15 mất kết nối trong quá trình thi',
                time: '10 phút trước',
                read: false,
                type: 'warning'
            },
            {
                id: 3,
                title: 'Thông tin mới',
                message: 'Đã thêm 25 câu hỏi mới vào ngân hàng đề',
                time: '1 giờ trước',
                read: false,
                type: 'info'
            },
            {
                id: 4,
                title: 'Kết thúc kỳ thi',
                message: 'Kỳ thi Lập trình C++ đã kết thúc',
                time: '2 giờ trước',
                read: true,
                type: 'success'
            },
            {
                id: 5,
                title: 'Lỗi hệ thống',
                message: 'Lỗi kết nối cơ sở dữ liệu đã được khắc phục',
                time: '3 giờ trước',
                read: true,
                type: 'error'
            }
        ];
    }

    setupNotifications() {
        const notificationBtn = document.getElementById('notification-btn');
        const notificationDropdown = document.getElementById('notification-dropdown');
        const closeNotifications = document.getElementById('close-notifications');
        const markAllRead = document.getElementById('mark-all-read');

        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('active');
            this.populateNotifications();
        });

        closeNotifications.addEventListener('click', () => {
            notificationDropdown.classList.remove('active');
        });

        markAllRead.addEventListener('click', () => {
            this.markAllNotificationsAsRead();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
                notificationDropdown.classList.remove('active');
            }
        });

        this.updateNotificationBadge();
    }

    populateNotifications() {
        const notificationList = document.getElementById('notification-list');
        const unreadCount = document.getElementById('unread-count');

        if (this.notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-bell"></i>
                    <p>Không có thông báo mới</p>
                </div>
            `;
        } else {
            notificationList.innerHTML = this.notifications.map(notification => `
                <div class="notification-item ${!notification.read ? 'unread' : ''}" 
                     onclick="markNotificationAsRead(${notification.id})">
                    <div class="notification-icon">
                        ${this.getNotificationIcon(notification.type)}
                    </div>
                    <div class="notification-content">
                        <div class="notification-text">
                            <h4>${notification.title}</h4>
                            <p>${notification.message}</p>
                        </div>
                        <div class="notification-meta">
                            <span class="notification-time">${notification.time}</span>
                            ${!notification.read ? `
                                <button class="btn-mark-read" title="Đánh dấu đã đọc" onclick="event.stopPropagation(); markNotificationAsRead(${notification.id})">
                                    <i class="fas fa-check"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        const unreadNotifications = this.notifications.filter(n => !n.read);
        unreadCount.textContent = unreadNotifications.length;
        unreadCount.style.display = unreadNotifications.length > 0 ? 'inline' : 'none';
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return 'ℹ️';
        }
    }

    markAllNotificationsAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.updateNotificationBadge();
        this.populateNotifications();
        this.showToast('Đã đánh dấu tất cả thông báo đã đọc', 'success');
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }

    setupProfileModal() {
        const userProfile = document.getElementById('user-profile');
        const profileModal = document.getElementById('profile-modal');
        const avatarUpload = document.getElementById('avatar-upload');

        userProfile.addEventListener('click', () => {
            profileModal.classList.add('active');
        });

        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('profile-avatar').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Search functionality
        document.querySelectorAll('.search-input, .search-box input').forEach(input => {
            input.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        });

        // Button actions
        this.setupButtonActions();

        // Machines input change
        const machinesInput = document.getElementById('machines-input');
        if (machinesInput) {
            machinesInput.addEventListener('input', () => {
                this.updateQuestionsList();
            });
        }

        // Dialog search and filters
        const dialogSearch = document.getElementById('dialog-search');
        if (dialogSearch) {
            dialogSearch.addEventListener('input', () => this.filterDialogQuestions());
        }

        const dialogSubjectFilter = document.getElementById('dialog-subject-filter');
        if (dialogSubjectFilter) {
            dialogSubjectFilter.addEventListener('change', () => this.filterDialogQuestions());
        }

        const dialogDifficultyFilter = document.getElementById('dialog-difficulty-filter');
        if (dialogDifficultyFilter) {
            dialogDifficultyFilter.addEventListener('change', () => this.filterDialogQuestions());
        }

        // Question count input change
        const questionCountInput = document.getElementById('question-count-input');
        if (questionCountInput) {
            questionCountInput.addEventListener('input', () => {
                this.updateQuestionCountConstraints();
            });
        }
    }

    updateQuestionCountConstraints() {
        const questionCountInput = document.getElementById('question-count-input');
        const selectedCount = this.selectedQuestions.size || 1;
        
        if (questionCountInput) {
            questionCountInput.max = selectedCount;
            if (parseInt(questionCountInput.value) > selectedCount) {
                questionCountInput.value = selectedCount;
            }
        }
    }

    setupButtonActions() {
        // Exam config buttons
        const selectQuestionsBtn = document.getElementById('select-questions-btn');
        if (selectQuestionsBtn) {
            selectQuestionsBtn.addEventListener('click', () => {
                this.showSelectQuestionsDialog();
            });
        }

        document.querySelectorAll('.btn-secondary').forEach(btn => {
            if (btn.textContent.includes('Tạo đề')) {
                btn.addEventListener('click', () => {
                    this.showToast('Đề thi đã được tạo thành công!', 'success');
                    this.updateQuestionsList();
                });
            }
        });

        // Close dialogs when clicking overlay
        document.querySelectorAll('.dialog-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });

        // Close modal when clicking overlay
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });
    }

    showSelectQuestionsDialog() {
        const dialog = document.getElementById('select-questions-dialog');
        dialog.classList.add('active');
        this.populateDialogQuestions();
    }

    populateDialogQuestions() {
        const container = document.getElementById('dialog-questions-list');
        if (!container) return;

        container.innerHTML = this.sampleData.questionsBank.map(q => `
            <div class="dialog-question-item">
                <div class="question-checkbox">
                    <input type="checkbox" id="q-${q.id}" ${this.selectedQuestions.has(q.id) ? 'checked' : ''} 
                           onchange="exam.toggleQuestionSelection(${q.id})">
                    <label for="q-${q.id}"></label>
                </div>
                <div class="question-preview">
                    <div class="question-text">${q.question}</div>
                    <div class="question-meta">
                        <span class="difficulty-badge ${this.getDifficultyClass(q.difficulty)}">${q.difficulty}</span>
                        ${q.images > 0 ? `<span class="image-indicator"><i class="fas fa-image"></i> ${q.images}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        this.updateDialogSelectedCount();
    }

    filterDialogQuestions() {
        const searchTerm = document.getElementById('dialog-search').value.toLowerCase();
        const subjectFilter = document.getElementById('dialog-subject-filter').value;
        const difficultyFilter = document.getElementById('dialog-difficulty-filter').value;

        const items = document.querySelectorAll('.dialog-question-item');
        items.forEach(item => {
            const questionText = item.querySelector('.question-text').textContent.toLowerCase();
            const difficulty = item.querySelector('.difficulty-badge').textContent;

            const matchesSearch = questionText.includes(searchTerm);
            const matchesSubject = !subjectFilter || true; // Implement subject matching if needed
            const matchesDifficulty = !difficultyFilter || difficulty === difficultyFilter;

            item.style.display = (matchesSearch && matchesSubject && matchesDifficulty) ? 'flex' : 'none';
        });
    }

    toggleQuestionSelection(questionId) {
        if (this.selectedQuestions.has(questionId)) {
            this.selectedQuestions.delete(questionId);
        } else {
            this.selectedQuestions.add(questionId);
        }
        this.updateDialogSelectedCount();
    }

    updateDialogSelectedCount() {
        const count = this.selectedQuestions.size;
        const countElement = document.getElementById('dialog-selected-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    clearSelectedQuestions() {
        this.selectedQuestions.clear();
        document.querySelectorAll('#dialog-questions-list input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        this.updateDialogSelectedCount();
    }

    confirmSelectedQuestions() {
        const count = this.selectedQuestions.size;
        document.getElementById('selected-count').textContent = count;
        this.closeDialog('select-questions-dialog');
        this.updateQuestionCountConstraints();
        this.showToast(`Đã chọn ${count} câu hỏi cho kỳ thi`, 'success');
    }

    closeDialog(dialogId) {
        document.getElementById(dialogId).classList.remove('active');
    }

    setupImageUpload() {
        const imageUpload = document.getElementById('image-upload');
        if (imageUpload) {
            imageUpload.addEventListener('change', (e) => {
                this.handleImageUpload(e.target.files);
            });
        }
    }

    setupQuestionForm() {
        // Question content
        const questionContent = document.getElementById('question-content');
        if (questionContent) {
            questionContent.addEventListener('input', (e) => {
                this.currentQuestion.content = e.target.value;
            });
        }

        // Answer inputs
        document.querySelectorAll('.answer-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const option = e.target.dataset.option;
                this.updateAnswer(option, e.target.value);
            });
        });

        // Correct answer select
        const correctAnswerSelect = document.getElementById('correct-answer-select');
        if (correctAnswerSelect) {
            correctAnswerSelect.addEventListener('change', (e) => {
                this.currentQuestion.correctAnswer = e.target.value;
                this.updateCorrectAnswerDisplay();
            });
        }

        // Difficulty select
        const difficultySelect = document.getElementById('quiz-difficulty-select');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.currentQuestion.difficulty = e.target.value;
            });
        }

        // Search questions
        const searchInput = document.getElementById('search-questions-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuestions(e.target.value);
            });
        }
    }

    handleImageUpload(files) {
        if (this.currentQuestion.images.length >= this.maxImages) {
            this.showToast(`Chỉ được phép tải tối đa ${this.maxImages} hình ảnh`, 'warning');
            return;
        }

        const remainingSlots = this.maxImages - this.currentQuestion.images.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);

        filesToProcess.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageData = {
                        id: Date.now() + Math.random(),
                        name: file.name,
                        url: e.target.result,
                        size: file.size
                    };
                    this.currentQuestion.images.push(imageData);
                    this.updateImagePreview();
                };
                reader.readAsDataURL(file);
            }
        });

        if (files.length > remainingSlots) {
            this.showToast(`Chỉ tải được ${remainingSlots} ảnh do giới hạn tối đa ${this.maxImages} ảnh`, 'warning');
        }
    }

    updateImagePreview() {
        const previewGrid = document.getElementById('image-preview-grid');
        if (!previewGrid) return;

        previewGrid.innerHTML = this.currentQuestion.images.map(image => `
            <div class="image-preview-item">
                <img src="${image.url}" alt="${image.name}">
                <button class="image-remove-btn" onclick="exam.removeImage('${image.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        if (this.currentQuestion.images.length === 0) {
            previewGrid.innerHTML = '<div class="image-preview-empty">Chưa có hình ảnh nào</div>';
        }
    }

    removeImage(imageId) {
        this.currentQuestion.images = this.currentQuestion.images.filter(img => img.id != imageId);
        this.updateImagePreview();
        this.showToast('Đã xóa hình ảnh', 'success');
    }

    updateAnswer(option, value) {
        const answerIndex = this.currentQuestion.answers.findIndex(a => a.option === option);
        if (answerIndex >= 0) {
            this.currentQuestion.answers[answerIndex].text = value;
        } else {
            this.currentQuestion.answers.push({ option, text: value });
        }
    }

    updateCorrectAnswerDisplay() {
        document.querySelectorAll('.answer-option').forEach(option => {
            const label = option.querySelector('.option-label').textContent;
            option.classList.toggle('correct', label === this.currentQuestion.correctAnswer);
        });
    }

    addAnswer() {
        const answersList = document.getElementById('answers-list');
        const currentAnswers = answersList.querySelectorAll('.answer-option').length;
        
        if (currentAnswers >= 6) {
            this.showToast('Tối đa 6 đáp án cho mỗi câu hỏi', 'warning');
            return;
        }

        const nextOption = String.fromCharCode(65 + currentAnswers); // A, B, C, D, E, F
        const newAnswer = document.createElement('div');
        newAnswer.className = 'answer-option';
        newAnswer.dataset.option = nextOption;
        newAnswer.innerHTML = `
            <span class="option-label">${nextOption}</span>
            <input type="text" placeholder="Nhập đáp án..." class="answer-input" data-option="${nextOption}">
            <button class="btn-remove-answer" onclick="exam.removeAnswer(this)">
                <i class="fas fa-times"></i>
            </button>
        `;

        answersList.appendChild(newAnswer);

        // Add event listener for new input
        const newInput = newAnswer.querySelector('.answer-input');
        newInput.addEventListener('input', (e) => {
            this.updateAnswer(nextOption, e.target.value);
        });

        // Update correct answer select
        this.updateCorrectAnswerOptions();
        this.showToast(`Đã thêm đáp án ${nextOption}`, 'success');
    }

    removeAnswer(button) {
        const answerOption = button.closest('.answer-option');
        const option = answerOption.querySelector('.option-label').textContent;
        
        // Don't allow removing if less than 2 answers
        const totalAnswers = document.querySelectorAll('.answer-option').length;
        if (totalAnswers <= 2) {
            this.showToast('Phải có ít nhất 2 đáp án', 'warning');
            return;
        }

        answerOption.remove();
        
        // Remove from current question data
        this.currentQuestion.answers = this.currentQuestion.answers.filter(a => a.option !== option);
        
        // Re-label remaining answers
        this.relabelAnswers();
        this.updateCorrectAnswerOptions();
        this.showToast(`Đã xóa đáp án ${option}`, 'success');
    }

    relabelAnswers() {
        const answerOptions = document.querySelectorAll('.answer-option');
        answerOptions.forEach((option, index) => {
            const newLabel = String.fromCharCode(65 + index);
            const label = option.querySelector('.option-label');
            const input = option.querySelector('.answer-input');
            
            label.textContent = newLabel;
            input.dataset.option = newLabel;
            option.dataset.option = newLabel;
        });
    }

    updateCorrectAnswerOptions() {
        const correctAnswerSelect = document.getElementById('correct-answer-select');
        if (!correctAnswerSelect) return;

        const currentAnswers = document.querySelectorAll('.answer-option').length;
        const currentValue = correctAnswerSelect.value;
        
        correctAnswerSelect.innerHTML = '';
        for (let i = 0; i < currentAnswers; i++) {
            const option = String.fromCharCode(65 + i);
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            if (option === currentValue) {
                optionElement.selected = true;
            }
            correctAnswerSelect.appendChild(optionElement);
        }
    }

    addQuestion() {
        this.clearForm();
        this.showToast('Đã tạo form câu hỏi mới', 'info');
    }

    saveQuestion() {
        // Validate question
        const questionContent = document.getElementById('question-content').value;
        if (!questionContent.trim()) {
            this.showToast('Vui lòng nhập nội dung câu hỏi', 'error');
            return;
        }

        const answers = document.querySelectorAll('.answer-input');
        let validAnswers = 0;
        const answerData = [];

        answers.forEach(input => {
            if (input.value.trim()) {
                validAnswers++;
                answerData.push({
                    option: input.dataset.option,
                    text: input.value.trim()
                });
            }
        });

        if (validAnswers < 2) {
            this.showToast('Phải có ít nhất 2 đáp án', 'error');
            return;
        }

        // Save question logic here
        const questionData = {
            ...this.currentQuestion,
            id: this.currentQuestion.id || Date.now(),
            content: questionContent,
            difficulty: document.getElementById('quiz-difficulty-select').value,
            correctAnswer: document.getElementById('correct-answer-select').value,
            subject: document.getElementById('quiz-subject-select').value,
            answers: answerData
        };

        // Update existing question or add new one
        const existingIndex = this.sampleData.questionsBank.findIndex(q => q.id == questionData.id);
        if (existingIndex >= 0) {
            this.sampleData.questionsBank[existingIndex] = {
                id: questionData.id,
                question: questionData.content,
                difficulty: questionData.difficulty,
                author: 'admin',
                images: questionData.images.length,
                answers: questionData.answers,
                correctAnswer: questionData.correctAnswer
            };
            this.showToast('Đã cập nhật câu hỏi thành công!', 'success');
        } else {
            // Add to questions bank
            this.sampleData.questionsBank.unshift({
                id: questionData.id,
                question: questionData.content,
                difficulty: questionData.difficulty,
                author: 'admin',
                images: questionData.images.length,
                answers: questionData.answers,
                correctAnswer: questionData.correctAnswer
            });
            this.showToast('Đã lưu câu hỏi thành công!', 'success');
        }

        this.updateQuestionsBankTable();
        this.isEditing = false;
    }

    clearForm() {
        this.currentQuestion = {
            id: null,
            content: '',
            answers: [],
            correctAnswer: 'A',
            difficulty: 'Dễ',
            images: []
        };

        document.getElementById('question-content').value = '';
        
        // Reset answers to default 4
        const answersList = document.getElementById('answers-list');
        answersList.innerHTML = `
            <label>Các đáp án</label>
            <div class="answer-option" data-option="A">
                <span class="option-label">A</span>
                <input type="text" placeholder="Nhập đáp án..." class="answer-input" data-option="A">
                <button class="btn-remove-answer" onclick="removeAnswer(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="answer-option correct" data-option="B">
                <span class="option-label">B</span>
                <input type="text" placeholder="Nhập đáp án..." class="answer-input" data-option="B">
                <button class="btn-remove-answer" onclick="removeAnswer(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="answer-option" data-option="C">
                <span class="option-label">C</span>
                <input type="text" placeholder="Nhập đáp án..." class="answer-input" data-option="C">
                <button class="btn-remove-answer" onclick="removeAnswer(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="answer-option" data-option="D">
                <span class="option-label">D</span>
                <input type="text" placeholder="Nhập đáp án..." class="answer-input" data-option="D">
                <button class="btn-remove-answer" onclick="removeAnswer(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Re-attach event listeners
        document.querySelectorAll('.answer-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const option = e.target.dataset.option;
                this.updateAnswer(option, e.target.value);
            });
        });

        document.getElementById('quiz-difficulty-select').value = 'Dễ';
        document.getElementById('correct-answer-select').value = 'A';
        this.updateImagePreview();
        this.updateCorrectAnswerDisplay();
        this.isEditing = false;
    }

    importExcel() {
        this.showToast('Chức năng import Excel đang được phát triển', 'info');
    }

    exportExcel() {
        this.showToast('Chức năng export Excel đang được phát triển', 'info');
    }

    searchQuestions(query) {
        const tbody = document.getElementById('questions-bank-table');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(query.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Show view
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');

        this.currentView = viewName;

        // Update page title
        const titles = {
            home: 'THI TRẮC NGHIỆM',
            connections: 'QUẢN LÝ KẾT NỐI',
            management: 'QUẢN LÝ HỆ THỐNG',
            quiz: 'TẠO CÂU HỎI'
        };
        document.querySelector('.page-title').textContent = titles[viewName] || 'THI TRẮC NGHIỆM';
    }

    setupInputControls() {
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const input = btn.closest('.input-with-controls').querySelector('input');
                const isIncrement = btn.textContent === '+';
                const currentValue = parseInt(input.value) || 0;
                const min = parseInt(input.getAttribute('min')) || 0;
                const max = parseInt(input.getAttribute('max')) || 999;

                if (isIncrement && currentValue < max) {
                    input.value = currentValue + 1;
                } else if (!isIncrement && currentValue > min) {
                    input.value = currentValue - 1;
                }

                // Update questions when count changes
                if (input.id === 'question-count-input') {
                    this.updateQuestionCountConstraints();
                }
                
                if (input.closest('.form-group').querySelector('label').textContent.includes('Số câu hỏi')) {
                    this.updateQuestionsList();
                }
            });
        });
    }

    setupMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        });
    }

    generateSampleData() {
        return {
            questions: Array.from({length: 50}, (_, i) => ({
                id: i + 1,
                machine: `Máy ${i + 1}`,
                count: 11
            })),
            connections: Array.from({length: 15}, (_, i) => ({
                id: i + 1,
                mssv: `SV${String(i + 1).padStart(6, '0')}`,
                name: `Nguyễn Văn ${String.fromCharCode(65 + i)}`,
                machine: `PC${String(i + 1).padStart(2, '0')}`,
                time: `${Math.floor(Math.random() * 60)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                test: `Đề ${Math.floor(Math.random() * 5) + 1}`,
                status: ['online', 'offline', 'testing'][Math.floor(Math.random() * 3)]
            })),
            questionsBank: Array.from({length: 25}, (_, i) => ({
                id: i + 1,
                question: [
                    'Lệnh nào sẽ hủy lệnh khởi động lại hệ điều hành trước đó trong Linux?',
                    'Tạo file và nhập nội dung với lệnh cat>name_of_file. Kết thúc lệnh như thế nào?',
                    'Tập tin có dấu "." phía trước có đặc tính gì đặc biệt?',
                    'Trong hệ thống Linux, user nào có quyền cao nhất?',
                    'Lệnh ls -lr /etc thực hiện hành động gì?',
                    'Để xem nội dung của tập tin văn bản, ta dùng lệnh nào?',
                    'Lệnh nào sẽ tắt lệnh hệ điều hành Linux trong chế độ khiến?',
                    'Process nào có PID là 1 trong Linux?',
                    'Để thay đổi quyền truy cập file, ta sử dụng lệnh nào?',
                    'Cách nào để xem các process đang chạy trong Linux?',
                    'Lệnh mount dùng để làm gì?',
                    'Thư mục /var trong Linux lưu trữ gì?',
                    'Để tìm kiếm file theo tên, ta dùng lệnh nào?',
                    'Cron job được cấu hình trong file nào?',
                    'Để nén file/folder, ta có thể dùng lệnh nào?',
                    'Service nào quản lý mạng trong Linux?',
                    'Để xem thông tin hệ thống, ta dùng lệnh nào?',
                    'File /etc/passwd chứa thông tin gì?',
                    'Để tạo symbolic link, ta dùng tham số nào với lệnh ln?',
                    'Swap partition có tác dụng gì?',
                    'Để kill một process, ta dùng lệnh nào?',
                    'File system ext4 có ưu điểm gì?',
                    'Để xem log hệ thống, ta xem file nào?',
                    'Lệnh sudo có tác dụng gì?',
                    'Để thay đổi owner của file, ta dùng lệnh nào?'
                ][i] || `Câu hỏi số ${i + 1} về hệ điều hành Linux`,
                difficulty: ['Dễ', 'Trung bình', 'Khó'][Math.floor(Math.random() * 3)],
                author: 'admin',
                images: Math.floor(Math.random() * 3),
                answers: [
                    { option: 'A', text: `Đáp án A cho câu ${i + 1}` },
                    { option: 'B', text: `Đáp án B cho câu ${i + 1}` },
                    { option: 'C', text: `Đáp án C cho câu ${i + 1}` },
                    { option: 'D', text: `Đáp án D cho câu ${i + 1}` }
                ],
                correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
            }))
        };
    }

    populateData() {
        this.updateQuestionsList();
        this.updateConnectionsTable();
        this.updateQuestionsBankTable();
    }

    updateQuestionsList() {
        const tbody = document.getElementById('questions-table');
        if (!tbody) return;

        const machinesCount = parseInt(document.getElementById('machines-input').value) || 29;
        const questions = this.sampleData.questions.slice(0, machinesCount);

        tbody.innerHTML = questions.map(q => `
            <tr>
                <td>${q.id}</td>
                <td>${q.machine}</td>
                <td>${q.count}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="exam.viewQuestionDetails(${q.id})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="exam.deleteQuestion(${q.id})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateConnectionsTable() {
        const tbody = document.getElementById('connections-table');
        if (!tbody) return;

        tbody.innerHTML = this.sampleData.connections.map(conn => `
            <tr>
                <td>${conn.id}</td>
                <td>${conn.mssv}</td>
                <td>${conn.name}</td>
                <td>${conn.machine}</td>
                <td>${conn.time}</td>
                <td>${conn.test}</td>
                <td>
                    <span class="status-badge status-${conn.status}">
                        ${this.getStatusText(conn.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="exam.viewConnection(${conn.id})" title="Xem">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="exam.kickConnection(${conn.id})" title="Ngắt kết nối">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updateQuestionsBankTable() {
        const tbody = document.getElementById('questions-bank-table');
        if (!tbody) return;

        tbody.innerHTML = this.sampleData.questionsBank.map(q => `
            <tr>
                <td>${q.id}</td>
                <td>
                    ${q.question}
                    ${q.images > 0 ? `<span class="image-indicator"><i class="fas fa-image"></i> ${q.images}</span>` : ''}
                </td>
                <td>
                    <span class="status-badge ${this.getDifficultyClass(q.difficulty)}">
                        ${q.difficulty}
                    </span>
                </td>
                <td>${q.author}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="exam.editBankQuestion(${q.id})" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="exam.deleteBankQuestion(${q.id})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            online: 'Trực tuyến',
            offline: 'Ngoại tuyến',
            testing: 'Đang thi'
        };
        return statusMap[status] || status;
    }

    getDifficultyClass(difficulty) {
        const classMap = {
            'Dễ': 'status-online',
            'Trung bình': 'status-testing',
            'Khó': 'status-offline'
        };
        return classMap[difficulty] || 'status-online';
    }

    handleSearch(query) {
        const currentTable = this.getCurrentTable();
        if (!currentTable) return;

        const rows = currentTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(query.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }

    getCurrentTable() {
        const activeView = document.querySelector('.view.active');
        return activeView ? activeView.querySelector('.data-table') : null;
    }

    // Action methods
    viewQuestionDetails(id) {
        // Tìm một câu hỏi mẫu để hiển thị chi tiết (không hiện đáp án đúng)
        const question = this.sampleData.questionsBank[Math.floor(Math.random() * this.sampleData.questionsBank.length)];
        
        document.getElementById('view-question-text').textContent = question.question;
        document.getElementById('view-question-difficulty').textContent = question.difficulty;
        document.getElementById('view-question-author').textContent = question.author;
        
        // Hiển thị câu trả lời nhưng không đánh dấu đáp án đúng
        const answersContainer = document.getElementById('view-question-answers');
        answersContainer.innerHTML = question.answers.map(answer => `
            <div class="answer-item">
                <span class="answer-label">${answer.option}</span>
                <span class="answer-text">${answer.text}</span>
            </div>
        `).join('');

        document.getElementById('view-question-dialog').classList.add('active');
    }

    deleteQuestion(id) {
        if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
            this.showToast(`Đã xóa câu hỏi #${id}`, 'success');
            this.updateQuestionsList();
        }
    }

    viewConnection(id) {
        this.showToast(`Xem chi tiết kết nối #${id}`, 'info');
    }

    kickConnection(id) {
        if (confirm('Bạn có chắc chắn muốn ngắt kết nối này?')) {
            this.showToast(`Đã ngắt kết nối #${id}`, 'warning');
            this.updateConnectionsTable();
        }
    }

    editBankQuestion(id) {
        const question = this.sampleData.questionsBank.find(q => q.id == id);
        if (question) {
            // Load question data into form
            document.getElementById('question-content').value = question.question;
            document.getElementById('quiz-difficulty-select').value = question.difficulty;
            
            // Clear current answers and load new ones
            const answersList = document.getElementById('answers-list');
            answersList.innerHTML = '<label>Các đáp án</label>';

            question.answers.forEach((answer, index) => {
                const answerDiv = document.createElement('div');
                answerDiv.className = answer.option === question.correctAnswer ? 'answer-option correct' : 'answer-option';
                answerDiv.dataset.option = answer.option;
                answerDiv.innerHTML = `
                    <span class="option-label">${answer.option}</span>
                    <input type="text" value="${answer.text}" class="answer-input" data-option="${answer.option}">
                    <button class="btn-remove-answer" onclick="exam.removeAnswer(this)">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                answersList.appendChild(answerDiv);
            });

            // Re-attach event listeners
            document.querySelectorAll('.answer-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const option = e.target.dataset.option;
                    this.updateAnswer(option, e.target.value);
                });
            });
            
            if (question.correctAnswer) {
                document.getElementById('correct-answer-select').value = question.correctAnswer;
                this.updateCorrectAnswerDisplay();
                this.updateCorrectAnswerOptions();
            }
            
            this.currentQuestion.id = id;
            this.isEditing = true;
            this.switchView('quiz');
            this.showToast('Đã tải câu hỏi để chỉnh sửa', 'info');
        }
    }

    deleteBankQuestion(id) {
        if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?')) {
            this.sampleData.questionsBank = this.sampleData.questionsBank.filter(q => q.id != id);
            this.showToast(`Đã xóa câu hỏi #${id} khỏi ngân hàng`, 'success');
            this.updateQuestionsBankTable();
        }
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add to DOM and animate
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Initialize the application
const exam = new ExamManagementSystem();

// Global functions for HTML onclick events
function adjustValue(inputId, delta) {
    const input = document.getElementById(inputId);
    const currentValue = parseInt(input.value) || 0;
    const min = parseInt(input.getAttribute('min')) || 0;
    const max = parseInt(input.getAttribute('max')) || 999;
    
    // For question count, respect the selected questions limit
    if (inputId === 'question-count-input') {
        const maxQuestions = Math.max(exam.selectedQuestions.size, 1);
        const newValue = Math.max(min, Math.min(maxQuestions, currentValue + delta));
        input.value = newValue;
        input.max = maxQuestions;
    } else {
        const newValue = Math.max(min, Math.min(max, currentValue + delta));
        input.value = newValue;
    }
}

function closeDialog(dialogId) {
    exam.closeDialog(dialogId);
}

function clearSelectedQuestions() {
    exam.clearSelectedQuestions();
}

function confirmSelectedQuestions() {
    exam.confirmSelectedQuestions();
}

function addQuestion() {
    exam.addQuestion();
}

function saveQuestion() {
    exam.saveQuestion();
}

function clearForm() {
    exam.clearForm();
}

function addAnswer() {
    exam.addAnswer();
}

function removeAnswer(button) {
    exam.removeAnswer(button);
}

function importExcel() {
    exam.importExcel();
}

function exportExcel() {
    exam.exportExcel();
}

function markNotificationAsRead(id) {
    const notification = exam.notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        exam.updateNotificationBadge();
        exam.populateNotifications();
    }
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.remove('active');
}

function toggleEditMode() {
    const isEditing = document.getElementById('edit-profile-btn').style.display === 'none';
    
    if (isEditing) {
        // Exit edit mode
        document.getElementById('edit-profile-btn').style.display = 'inline-flex';
        document.getElementById('cancel-edit-btn').style.display = 'none';
        document.getElementById('save-profile-btn').style.display = 'none';
        document.getElementById('avatar-upload-btn').style.display = 'none';
        
        // Show values, hide inputs
        ['name', 'email', 'phone', 'address', 'department', 'position'].forEach(field => {
            document.getElementById(`${field}-display`).style.display = 'block';
            document.getElementById(`${field}-input`).style.display = 'none';
        });
    } else {
        // Enter edit mode
        document.getElementById('edit-profile-btn').style.display = 'none';
        document.getElementById('cancel-edit-btn').style.display = 'inline-flex';
        document.getElementById('save-profile-btn').style.display = 'inline-flex';
        document.getElementById('avatar-upload-btn').style.display = 'flex';
        
        // Hide values, show inputs
        ['name', 'email', 'phone', 'address', 'department', 'position'].forEach(field => {
            document.getElementById(`${field}-display`).style.display = 'none';
            document.getElementById(`${field}-input`).style.display = 'block';
            // Copy current value to input
            const displayElement = document.getElementById(`${field}-display`);
            const inputElement = document.getElementById(`${field}-input`);
            inputElement.value = displayElement.textContent;
        });
    }
}

function cancelEdit() {
    toggleEditMode();
}

function saveProfile() {
    // Update display values from inputs
    ['name', 'email', 'phone', 'address', 'department', 'position'].forEach(field => {
        const inputElement = document.getElementById(`${field}-input`);
        const displayElement = document.getElementById(`${field}-display`);
        displayElement.textContent = inputElement.value;
    });
    
    // Update profile header
    document.getElementById('profile-display-name').textContent = document.getElementById('name-input').value;
    document.getElementById('profile-display-position').textContent = document.getElementById('position-input').value;
    
    // Exit edit mode
    toggleEditMode();
    
    exam.showToast('Đã lưu thông tin tài khoản thành công!', 'success');
}