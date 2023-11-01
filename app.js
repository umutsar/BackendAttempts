const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Veritabanı bağlantısı
const db = new sqlite3.Database('mesajlar.db');

io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı.');

    socket.on('login', (data) => {
        const { username, password } = data;
        // Kullanıcıyı veritabanında kontrol et
        db.get("SELECT * FROM kullanicilar WHERE kullaniciadi = ? AND sifre = ?", [username, password], (err, row) => {
            if (err) {
                console.error(err.message);
                socket.emit('loginResponse', { success: false });
            } else {
                if (row) {
                    currentUsername = username; // Giriş yapan kullanıcının adını sakla
                    socket.emit('loginResponse', { success: true });
                } else {
                    socket.emit('loginResponse', { success: false });
                }
            }
        });
    });

    socket.on('sendMessage', (data) => {
        const message = data;
        console.log(message)
        if (currentUsername) {
            io.emit('message', { username: currentUsername, message: message }); // Kullanıcı adı ile birlikte mesajı gönder
            // Mesajı veritabanına kaydetme
            db.run("INSERT INTO messages (message, username) VALUES (?, ?)", [message, currentUsername], function(err) {
                if (err) {
                    return console.log(err.message);
                }
                console.log(`A row has been inserted with rowid ${this.lastID}`);
            });
        }
    });

    socket.on('getInitialMessages', () => {
        db.all("SELECT * FROM messages", (err, rows) => {
            if (err) {
                console.error(err.message);
            } else {
                const messages = rows.map(row => {
                    return row.username + ': ' + row.message;
                });
                socket.emit('initialMessages', messages);
            }
        });
    });

    socket.on('message', (data) => {
        console.log('Yeni bir mesaj alındı: ', data);
    });
});

app.use(express.static(__dirname + '/public'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} numaralı portta başlatıldı.`);
});
