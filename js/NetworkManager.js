// NetworkManager.js — Colyseus 连接管理层
(function () {
  'use strict';

  var SERVER_URL = 'ws://localhost:2567';

  window.NetworkManager = {
    client: null,
    room: null,

    connect: function () {
      if (!this.client) {
        this.client = new Colyseus.Client(SERVER_URL);
      }
      return this.client;
    },

    createRoom: async function (gameId, options) {
      this.connect();
      this.room = await this.client.create(gameId, options || {});
      return this.room;
    },

    joinRoomById: async function (roomId, options) {
      this.connect();
      this.room = await this.client.joinById(roomId, options || {});
      return this.room;
    },

    getRoom: function () {
      return this.room;
    },

    leaveRoom: function () {
      if (this.room) {
        this.room.leave(true);
        this.room = null;
      }
    }
  };
})();
