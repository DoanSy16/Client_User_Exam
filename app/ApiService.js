const URL ="https://captivatingly-draftier-beulah.ngrok-free.dev";
app.factory("ApiService", function ($http) {
  const API_URL = URL + "/api/v1/admin";

  return {
    getLevels: function () {
      return $http.get(API_URL + "/level_questions/load_data_level_questions");
    },
    getDisciplines: function () {
      return $http.get(API_URL + "/disciplines/load_data_discipline");
    },
    getQuestions: function (id) {
      return $http.post(API_URL + "/questions/load_data_questions", { id: id });
    },
    createCodeRoom: function () {
      return $http.get(API_URL + "/key/create_code_room");
    }

  };
});
//Lưu dữ liệu chuyển giữa các trang
app.factory("DataService", function () {
  let homeData = {};
  // let 

  return {
    setHomeData: function (key, value) {
      homeData[key] = value;
    },
    getHomeData: function (key) {
      return homeData[key];
    },
    getAllHomeData: function () {
      return homeData;
    }
  };
});
// kết nối socket 
app.factory("SocketService", function ($rootScope) {
  const socket = io(URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    secure: false,
  });

  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        const args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        const args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    }
  };
});




