"use strict";


var bcrypt = require('bcrypt-as-promised');
var HASH_ROUNDS = 10;

class RedditAPI {
    constructor(conn) {
        this.conn = conn;
    }

    createUser(user) {
        /*
        first we have to hash the password. we will learn about hashing next week.
        the goal of hashing is to store a digested version of the password from which
        it is infeasible to recover the original password, but which can still be used
        to assess with great confidence whether a provided password is the correct one or not
         */
        return bcrypt.hash(user.password, HASH_ROUNDS)
            .then(hashedPassword => {
                return this.conn.query('INSERT INTO users (username,password, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())', [user.username, hashedPassword]);
            })
            .then(result => {
                //console.log(result); //test to see what results returns
                return result.insertId;
                //NTS: see documentation on github for result and insertid
            })
            .catch(error => {
                // Special error handling for duplicate entry
                if (error.code === 'ER_DUP_ENTRY') {
                    throw new Error('A user with this username already exists');
                }
                else {
                    throw error;
                }
            });
    }

    createPost(post) {
        return this.conn.query( //NTS: note the this keyword
            `INSERT INTO posts (userId, title, url, createdAt, updatedAt)
            VALUES (?, ?, ?, NOW(), NOW())`,
            [post.userId, post.title, post.url]
        )
            .then(result => {
                return result.insertId;
            });
    }

    getAllPosts() {
        /*
        strings delimited with ` are an ES2015 feature called "template strings".
        they are more powerful than what we are using them for here. one feature of
        template strings is that you can write them on multiple lines. if you try to
        skip a line in a single- or double-quoted string, you would get a syntax error.

        therefore template strings make it very easy to write SQL queries that span multiple
        lines without having to manually split the string line by line.
         */
        return this.conn.query(
        `   SELECT posts.id, posts.title, posts.url, posts.userId, posts.createdAt, posts.updatedAt, 
                    users.id AS userId, users.userName, users.createdAt AS userJoinDate, users.updatedAt AS userUpdateDate    
            FROM posts JOIN users
                ON users.id = posts.userId
            ORDER BY posts.createdAt DESC
            LIMIT 25`
        )
        .then(results => results.map(function(row)
        {
            var rowData = {};
            rowData.id = row.id;
            rowData.title = row.title;
            rowData.url = row.url;
            rowData.createdAt = row.createdAt;
            rowData.updatedAt = row.updatedAt;
            rowData.userData = {};
            rowData.userData.id = row.userId;
            rowData.userData.userName = row.userName;
            rowData.userData.createdAt = row.userJoinDate;
            rowData.userData.updatedAt = row.userUpdateDate;
            return rowData;
        })
        );
    }
}

module.exports = RedditAPI;