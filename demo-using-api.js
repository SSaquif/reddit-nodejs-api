// load the mysql library
"use strict";

var mysql = require('promise-mysql');

// create a connection to our Cloud9 server
var connection = mysql.createPool({
    host     : 'localhost',
    user     : 'ssaquif', // CHANGE THIS :)
    password : '',
    database : 'reddit',        //
    connectionLimit: 10
});

// load our API and pass it the connection
var RedditAPI = require('./reddit');

var myReddit = new RedditAPI(connection); //A new object of the reddit class in reddit.js file


/*myReddit.createSubreddit({
        name: "aww",
        description: "puppies"  //my description fields
})
    .then(insertId => {
        console.log('New sub created' + insertId);
    });*/

// We call this function to create a new user to test our API
// The function will return the newly created user's ID in the callback
myReddit.createUser({
    username: 'ME_IRL_1234',
    password: 'abc123abc'
})
    .then(newUserId => {
        // Now that we have a user ID, we can use it to create a new post
        // Each post should be associated with a user ID
        console.log('New user created! ID=' + newUserId);

        return myReddit.createPost({
            title: 'Hello Reddit! This is my first post',
            subredditId: 1, // for testing
            url: 'http://www.digg.com',
            userId: newUserId
        });
    })
    .then(newPostId => {
        // If we reach that part of the code, then we have a new post. We can print the ID
        console.log('New post created! ID=' + newPostId);
    })
    .catch(error => {
        console.log(error.stack);
    });


/*myReddit.createVote({
    userId: 4,
    postId: 2,
    voteDirection: -1
})
    .then(newVoteId => { 
        //Reminder: newVoteId === value of insertId, in this case a 0
        //As there is not INT AUTO INCREMENT PRM KEY in votes table 
        console.log('The vote was added=' + newVoteId);
    })
    .catch(error => {
        console.log("error");
        console.log(error.stack);
    });


myReddit.getAllPosts()
    .then(result => 
    {
       console.log(result);
       //console.log(result[0].id); 
    });*/