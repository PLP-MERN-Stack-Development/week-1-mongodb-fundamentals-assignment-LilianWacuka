const { MongoClient } = require('mongodb');
//mongoDB connection URI
const uri = 'mongodb://localhost:27017';
const dbName = 'plp_bookstore';

async function runQueries() {
    const client = new MongoClient (uri);
    try{
        await client.connect();
        console.log('Connected to MongoDB');
            const db = client.db(dbName);
            const books = db.collection('books');
            //1. find all books with specific genre
            const fictionBooks = await books.find({genre: "Fiction"}).toArray();
            console.log("\nFiction books:", fictionBooks);
            const fantasyBooks = await books.find({genre: "Fantasy"}).toArray();
            console.log("\nFantasy books:", fantasyBooks);

            //2. find books published after 1900
            const recentBooks = await books.find({published_year: {$gt: 1900}}).toArray();
            console.log("\nBooks published after 1900:", recentBooks);

            //3. find books by a specific author
            const orwellBooks = await books.find({ author: "George Orwell"}).toArray();
            console.log("\nBooks by George Orwell:", orwellBooks);

            //4. update the price of a specific book
            const updateResult = await books.updateOne(
                {title: "To Kill a Mockingbird"},
                { $set: { price: 9.99 }}
            );
            console.log(`\nUpdated ${updateResult.modifiedCount} book(s) with new price`);
            if (updateResult.modifiedCount > 0) {
                const updatedBook = await books.findOne({title: "To Kill a Mockingbird"});
                console.log("Updated book:", updatedBook);
            }

            //5. delete a book by title
            const deleteResult = await books.deleteOne({ title: "The Great Gatsby" });
            console.log(`\nDeleted ${deleteResult.deletedCount} book(s) with title "The Great Gatsby"`);

            //6. find books that are both in stock and published after 2010
            const recentInStockBooks = await books.find({
                in_stock: true,
                published_year: { $gt: 2010}
            }).project({ title: 1, author: 1, price: 1, _id: 0 }).toArray();
            console.log("\nBooks in stock published after 2010:", recentInStockBooks);

            //7.  Use projection to return only the title, author, and price fields in your queries
            const projectedBooks = await books.find({})
                .project({ title: 1, author: 1, price: 1, _id: 0 })
                .toArray();
            console.log("\nProjected books (title, author, price):", projectedBooks);
        console.log('Queries executed successfully');

        8. // display books by price both ascending
        const booksSortedAsc = await books.find({})
            .sort({ price: 1 })
            .project({ title: 1, author: 1, price: 1, _id: 0 })
            .toArray();
            console.log("\nBooks sorted by price (ascending):", booksSortedAsc);
            //display books by price both descending
            const booksSortedDesc = await books.find({})
                .sort({ price: -1 })
                .project({ title: 1, author: 1, price: 1, _id: 0 })
                .toArray();
            console.log('\nBooks sorted by price (descending):', booksSortedDesc);
//8. Use the `limit` and `skip` methods to implement pagination (5 books per page)
         const page1 = await books.find({})
          .project({ title: 1, author: 1, price: 1, _id: 0 })
          .sort({ title: 1 })
          .skip(0) 
          .limit(5)
          .toArray();

        console.log("\nPage 1 (first 5 books):", page1);

        const page2 = await books.find({})
          .project({ title: 1, author: 1, price: 1, _id: 0})
          .sort({ title:1 })
          .skip(5)
          .limit(5)
          .toArray()
          console.log("\nPage 2 (next 5 books):", page2);

          //Task 4: use the `aggregate` method to 
          // 1. calculate the average price of  books by genre
          const avgPriceByGenre = await books.aggregate([
            {
                $group:{
                    _id: "$genre",
                    averagePrice: { $avg: "$price"}
                }
            },
            {
                $sort: { averagePrice: -1}
            }
          ]).toArray();
            console.log("\nAverage price of books by genre:", avgPriceByGenre);
        //2. Author with the most books
        const topAuthor = await books.aggregate([
            {
                $group:{
                    _id: "$author",
                    totalBooks: { $sum:1}
                }
            },
            {
                $sort: { totalBooks: -1}
            },
            {
                $limit: 1
            }
        ]).toArray();
            console.log("\nAuthor with the most books:", topAuthor);
            //3.Boooks grouped by publication decade
            const booksByDecade = await books.aggregate([
                {
                    $project: {
                        title: 1,
                        decade: {
                           $concat: [
                            {$toString: { $multiply: [ {$floor: {$divide: ["$published_year", 10] }}, 10]}}, // Convert year to decade.
                            "s"

                           ] 
                        }
                    }
                },
                {
                    $group: {
                        _id: "$decade",
                        count: { $sum: 1 },
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]). toArray();
            console.log("\nBooks grouped by publication decade:", booksByDecade);
// Task 5: Indexing

            //1. Create an index on the `title` field for faster searches
        await books.createIndex({ title: 1});
            console.log("Index created on 'title' field");

            //2. Create a compound index on `author` and `published_year`
            await books.createIndex({ author: 1, published_year: -1});
            console.log("Compound index created on 'author' and 'published_year' fields");

            //3. Use explain() to compare search performance
            const explainResult = await books.find({ title: "1984" }).explain("executionStats");
            console.log("\nExplain result for search on 'title':", explainResult);
            console.log(`Execution time: ${explainResult.executionStats.executionTimeMillis} ms`);
            console.log(`Documents examined: ${explainResult.executionStats.totalDocsExamined}`);


        
    } catch (error){
        console.log ("Error running queries:", error);
    }finally{
        await client.close();
        console.log('Connection closed');
    }
}
runQueries();



