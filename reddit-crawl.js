var request = require('request-promise');
var mysql = require('promise-mysql');
var RedditAPI = require('./reddit');

function getSubreddits() {
	console.log("I am here");
	return request('https://www.reddit.com/.json')
		.then(response => {
			// Parse response as JSON and store in variable called result
			var result = JSON.parse(response); // continue this line
			//console.log(result);
			//console.log(result.data.children);
			// Use .map to return a list of subreddit names (strings) only
			return result.data.children.map(function(result2) {
				//Should return the 25 subreddit names on the first page of reddit
				console.log(result2.data.subreddit)
				return result2.data.subreddit;
			});
		})
		.catch(error=> {
		    throw error;
		});
}

//getSubreddits();


//This function takes a subreddit name object and returns a useable object for data creation
function getPostsForSubreddit(subredditName) {
    //limits to top 50 post 
	var url = `https://www.reddit.com/r/${subredditName}.json?limit=50`;
	return request(url)
		.then(response => {
			var result = JSON.parse(response);
			return result.data.children
				.filter(response => {
				    //filter returns a new array, removing entries that return false
				    //this filters all self-posts from the request result
					if(response.data.is_self === false) {
						return response.data;
					}
					return false; //return false other wise
				})
				//this maps a new array which contains only necessary information for data creation
				.map(response => {
					var mapped = {
						user : response.data.author,
						title: response.data.title,
						url: response.data.url
					};
					return mapped; // returning title,url & user objects only
				}); 
		});
}

function crawl() {
    // create a connection to the DB
    var connection = mysql.createPool({
        host     : 'localhost',
        user     : 'root',
        password : '',
        database: 'reddit2',
        connectionLimit: 10
    });

    // create a RedditAPI object. we will use it to insert new data
    var myReddit = new RedditAPI(connection);

    // This object will be used as a dictionary from usernames to user IDs
    var users = {};

    
/*    Crawling will go as follows:
        1. Get a list of popular subreddits
        2. Loop thru each subreddit and:
            a. Use the `createSubreddit` function to create it in your database
            b. When the creation succeeds, you will get the new subreddit's ID
            c. Call getPostsForSubreddit with the subreddit's name
            d. Loop thru each post and:
                i. Create the user associated with the post if it doesn't exist
                2. Create the post using the subreddit Id, userId, title and url*/
     

    // Get a list of subreddits
    getSubreddits()
        .then(subredditNames => {
            subredditNames.forEach((subredditName, index) => {
                var subId;
                myReddit.createSubreddit({name: subredditName})
                    .then(subredditId => {
                        subId = subredditId;
                        return getPostsForSubreddit(subredditName);
                    })
					//Create users, posts, and subreddits from getSubreddit data
                    .then(posts => {
                        posts.forEach(post => {
                            var userIdPromise;
                            if (users[post.user]) {
                                userIdPromise = Promise.resolve(users[post.user]);
                            }
                            else {
                                userIdPromise = myReddit.createUser({
                                    username: post.user,
                                    password: 'abc123'
                            })
                            .catch(function(err) {
                                    return users[post.user];
                                })
                            }

                            userIdPromise.then(userId => {
                                users[post.user] = userId;
                                return myReddit.createPost({
                                    subredditId: subId,
                                    userId: userId,
                                    title: post.title,
                                    url: post.url
                                });
                            });
                        });
                    });
            });
        });
}

// crvar request = require('request-promise');
var mysql = require('promise-mysql');
var RedditAPI = require('./reddit');
function getSubreddits() {
    return request('https://www.reddit.com/.json')
        .then(response => {
            // Parse response as JSON and store in variable called result
            var response= JSON.parse(response);
            // Use .map to return a list of subreddit names (strings) only
            return response.data.children.map(function(answer){
              var subreddit = answer.data.subreddit;
              return subreddit;
            })
        });
}

function getPostsForSubreddit(subredditName) {
    return request(`https://www.reddit.com/r/${subredditName}.json?limit=50`)
        .then(
            response => {
                var response = JSON.parse(response);
                // Parse the response as JSON and store in variable called result
              // continue this line
                return response.data.children
                    .filter(function(answer){
                      return !answer.data.is_self;
                      }) // Use .filter to remove self-posts
                    .map(function(item){
                      var titleOfPosts = {
                        title: item.data.title,
                        url: item.data.url,
                        user: item.data.author
                      }
                      return titleOfPosts;
                    }); // Use .map to return title/url/user objects only
            }
        );
}
function crawl() {
    //create a connection to the DB
    var connection = mysql.createPool({
        host     : 'localhost',
        user     : 'root',
        password : '',
        database: 'reddit2',
        connectionLimit: 10
    });
    // create a RedditAPI object. we will use it to insert new data
    var myReddit = new RedditAPI(connection);
    // This object will be used as a dictionary from usernames to user IDs
    var users = {};
    /*
    Crawling will go as follows:
        1. Get a list of popular subreddits
        2. Loop thru each subreddit and:
            a. Use the `createSubreddit` function to create it in your database
            b. When the creation succeeds, you will get the new subreddit's ID
            c. Call getPostsForSubreddit with the subreddit's name
            d. Loop thru each post and:
                i. Create the user associated with the post if it doesn't exist
                2. Create the post using the subreddit Id, userId, title and url
     */
    // Get a list of subreddits
    getSubreddits()
        .then(subredditNames => {
            subredditNames.forEach(subredditName => {
                var subId;
                myReddit.createSubreddit({name: subredditName})
                    .then(subredditId => {
                        subId = subredditId;
                        return getPostsForSubreddit(subredditName)
                    })
                    .then(posts => {
                        posts.forEach(post => {
                            var userIdPromise;
                            if (users[post.user]) {
                                userIdPromise = Promise.resolve(users[post.user]);
                            }
                            else {
                                userIdPromise = myReddit.createUser({
                                    username: post.user,
                                    password: 'abc123'
                            })
                            .catch(function(err) {
                                    return users[post.user];
                                })
                            }
                            userIdPromise.then(userId => {
                                users[post.user] = userId;
                                return myReddit.createPost({
                                    subredditId: subId,
                                    userId: userId,
                                    title: post.title,
                                    url: post.url
                                });
                            });
                        });
                    });
            });
        });
};

crawl();