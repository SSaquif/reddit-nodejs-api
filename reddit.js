"use strict";

var bcrypt = require('bcrypt-as-promised');
var HASH_ROUNDS = 10;

class RedditAPI {
    constructor(conn) {
        this.conn = conn;
    }
    
    createSubreddit(subreddit)
    {
        return this.conn.query (`INSERT INTO subreddits (name, description, createdAt, updatedAt) 
                                     VALUES (?,?, NOW(), NOW())`, [subreddit.name, subreddit.description])
        
        .then(result => {
            console.log(result);
            console.log(result.insertId);
            return result.insertId;
        })
        .catch(error => {
           if (error.code == 'ER_DUP_ENTRY'){
               throw new Error ('A subreddit with the same name already exists');
           }
           else{
               throw error;
           }
            
        });
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
                console.log(result); //test to see what results returns
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
            `INSERT INTO posts (userId, subredditId, title, url, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [post.userId, post.subredditId, post.title, post.url]
        )
            .then(result => {
                return result.insertId;
            })
            .catch(error => {
                if (error.code === 'ER_BAD_NULL_ERROR') {
                    throw new Error('A required field is missing');
                }
                throw error;
            });
    }
    
    createVote(vote) {
        console.log("I am here");
        return Promise.resolve()
        .then(resolved => {
            var query;
            console.log("I am here");
            console.log(vote.voteDirection);
            if (vote.voteDirection !== 1 && vote.voteDirection !== 0 && vote.voteDirection !== -1 ) {
                console.log("inside voteDirection check");
                throw "Vote Direction is Invalid";
            }
            else {
                console.log("creating the query");
                query = `INSERT INTO votes (userId, postId, voteDirection, createdAt, updatedAt)
                            VALUES (?,?,?, NOW(), NOW())
                            ON DUPLICATE KEY UPDATE voteDirection = ?, updatedAt = NOW()`;
            }
            console.log("before commiting query");
            return this.conn.query(query,[vote.userId, vote.postId, vote.voteDirection, vote.voteDirection]);
        })
        .then(result => {
            console.log("vote was inserted" + result.insertId);
            return result.insertId; //NTS: will return the vote id since it is a PRIMARY KEY INT AUTO INCREMENT FIELD
                                    //insertId returns 0 for all other successful insert, 
                                    //if table does not have a PRIMARY KEY INT AUTO INCREMENT FIELD        
        })
        .catch(error => {
            console.log("caught an error inside createVote catch");
            throw error; 
        });
    }
    
    //get all subreddits ordered by descending order of their creation date (i.e: latest first)
    getAllSubreddits() {
        return this.conn.query(
            `SELECT id, name, description, createdAt, updatedAt FROM subreddits ORDER BY createdAt DESC`
            );
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
        // this returns a flat array of "table row" objects
        return this.conn.query(
        `   SELECT posts.id, posts.title, posts.url, posts.userId, posts.createdAt, posts.updatedAt, 
                    users.id AS userId, users.userName, users.createdAt AS userJoinDate, users.updatedAt AS userUpdateDate,
                    subreddits.id AS subId, subreddits.name, subreddits.description, subreddits.createdAt AS subCreationDate, subreddits.updatedAt AS subUpdateDate
                    
            FROM users 
                JOIN posts ON users.id = posts.userId
                JOIN subreddits ON subreddits.id = posts.subredditId
                GROUP BY posts.id
                LIMIT 25`
        )
        //put them back later, needed to take em out for the express workshop
        //SUM(votes.voteDirection) AS voteScore, end of select
        //JOIN votes ON votes.postId = posts.id, last join //apparently use left join, review old notes
        //ORDER BY voteScore DESC,
        
        
        //map function to take each falt row from results array and unflatten it
        .then(result => result.map(function(row)  
        {   //NTS: Verbose code for self help for later, can make it without declaring rowdata
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
            rowData.subredditData = {};
            rowData.subredditData.id = row.subId;
            rowData.subredditData.name = row.name;
            rowData.subredditData.description = row.description;
            rowData.subredditData.subCreationDate = row.subCreationDate;
            rowData.subredditData.subUpdateDate = row.subUpdateDate;
            rowData.postVotes = {};
            rowData.postVotes.voteScore = row.voteScore;
            return rowData;
            
            // can also do something like this, but getting error here
            /*return {
                id = row.id,
                title = row.title,
                url = row.url,
                createdAt = row.createdAt,
                updatedAt = row.updatedAt,
                userData = {
                    id = row.userId,
                    userName = row.userName,
                    createdAt = row.userJoinDate,
                    updatedAt = row.userUpdateDate
                };*/
        })
        );
    }
}

module.exports = RedditAPI;