app.factory("ExamService", function () {
  let data_exam_questions = [];

  return {
    getAll: function () {
      return data_exam_questions;
    },
    setAll: function (data) {
      data_exam_questions = data;
    },
    updateExam: function (exam) {
      const index = data_exam_questions.findIndex(q => q.examId === exam.examId);
      if (index !== -1) {
        data_exam_questions[index] = exam;
      }
    }
  };
});

app.factory("CryptoService", function () {

  return {
    // Mã hóa
    encrypt: function (data, key) {
      if (!key) {
        console.error("Chưa truyền SECRET_KEY!");
        return null;
      }
      let data_user = JSON.parse(`[${localStorage.getItem("studentInfo")}]`);
      return CryptoJS.AES.encrypt(
        typeof data === "string" ? data : JSON.stringify(data),
        (data_user[0].roomId + key + data_user[0].studentId)
      ).toString();
    },

    // Giải mã
    decrypt: function (cipherText, key) {
      if (!key) {
        console.error("Chưa truyền SECRET_KEY!");
        return null;
      }
      try {
        let data_user = JSON.parse(`[${localStorage.getItem("studentInfo")}]`);
        const bytes = CryptoJS.AES.decrypt(cipherText, (data_user[0].roomId + key + data_user[0].studentId));
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted;
      } catch (e) {
        console.error("Lỗi giải mã:", e);
        return null;
      }
    }
  };
});
