 // Set the region where your identity pool exists (us-east-1, eu-west-1)
        AWS.config.region = 'us-west-2';

        // Configure the credentials provider to use your identity pool
               
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: 'us-west-2:afb03a9e-9ca2-44b1-95e6-c115bc3ce0ce',
        });

        // Make the call to obtain credentials
        AWS.config.credentials.get(function(){

            // Credentials will be available when this function is called.
            var accessKeyId = AWS.config.credentials.accessKeyId;
            var secretAccessKey = AWS.config.credentials.secretAccessKey;
            var sessionToken = AWS.config.credentials.sessionToken;
           // alert(accessKeyId);

        });
          
       // var albumBucketName = 'ramvittal-photoalbum2';
        var albumBucketName = 'trukreations.com';
        var bucketRegion = 'us-west-2';

          
          
          
        var s3 = new AWS.S3({
          apiVersion: '2006-03-01',
          params: {Bucket: albumBucketName}
        });
            
        var cloudFrontDomain = "https://d2yi5iip5jqkyz.cloudfront.net";

        //var dynamodb = new AWS.DynamoDB();
        var docClient = new AWS.DynamoDB.DocumentClient();
        
        //alert("test");
        
       
      // listAlbums();


//dynamo db functions


function addInventoryItem(item) {
    
    
    var params = {
                    TableName: "tru_inventory_item",
                    Item: {
                        "item_id": item.id,
                        "item_category": item.category,
                        "item_image_url": item.image_url,
                        "title": item.title,
                        "short_desc": item.shortDesc,
                        "long_desc": item.longDesc,
                        "price": item.price,
                        "quantity_on_hand":item.quantityOnHand,
                        "quantity_on_order":item.quantityOnOrder,
                        "similar_items": item.similarItems,
                    }
                };
    
     docClient.put(params, function (err, data) {
                    if (err) {
                        alert("Add item failed: " + JSON.stringify(err));
                    } 
                    else {
                        console.log("item added" +JSON.stringify(data));
                        alert('item added successfully');
                        
                    }
         
                });
    
}

        
       

function queryInventoryItems(in_catg,replaceElementId) {

    var params = {
        TableName : "tru_inventory_item",
        ProjectionExpression: "item_id, item_category, title, price, item_image_url, short_desc, long_desc, quantity_on_hand",
        FilterExpression: "item_category = :catg and quantity_on_hand > :qty",
        ExpressionAttributeValues : {
            ":catg": in_catg,
            ":qty" : 0
        }
    };
    
    var bucketUrl = cloudFrontDomain + '/';

    docClient.scan(params, onScan);
    
    
        function onScan(err, data) {
            if (err) {
                 console.log(JSON.stringify(err));
            } else {
                console.log("query successful:" +JSON.stringify(data));
                var htmlArray=['','','','','',''];
                var html = ['item1', 'item2'];
                var i=0;
                data.Items.forEach(function(element, index, array) {
                    console.log('title:' +element.title + " (" + element.item_image_url + ")");
                    
                    html =  [ 
                        '<div class="col-sm-3">',
                          '<div class="card simpleCart_shelfItem">',
                                '<div class="card-block" style="text-align:center;font-size:20px;">',
                                    
                                    '<span class="card-title item_name">' + element.title +  '</span>',
                                    
                                '</div>',
                                '<img id="' +element.item_id + '" ' + 'src="' + bucketUrl + element.item_image_url + '"  onclick="displayItemDetail(this)">',
                                '<div class="card-block" style="font-size:12px;">',
                                    '<p id="' +element.item_id + '-desc"' + 'class="card-text">' + element.short_desc + ' Item# <span class="item_number">' + element.item_id +  '</span>&nbsp; </p>',
                                    '<p id="' +element.item_id + '-price"' + 'class="card-text"><span class="item_price" style="color:red">$' + element.price +  '</span>&nbsp;&nbsp;<button class="btn btn-success item_add" style="font-size:10px;">Add to Cart</button></p>',
                                '</div>',
                            '</div>',
                        '</div>']
                    htmlArray[i] = html.join("");
                    i = i +1;
                });
                
                console.log(htmlArray)
                document.getElementById(replaceElementId).innerHTML = htmlArray.join("");

            }
        }
        
}
    

function getInventoryItem(itemId) {
    
    
    var params = {
                    TableName: "tru_inventory_item",
                    Key: {
                        "item_id": itemId
                    }
                };
    
     docClient.get(params, function (err, data) {
                    if (err) {
                        console.log(JSON.stringify(err));
                    } else {
                         console.log("item image url" +JSON.stringify(data.Item.item_image_url));
                    }

                });
    
}

      
        
        function viewAlbum(albumName, replaceElementId) {
            //alert(albumName);
             //var albumPhotosKey = encodeURIComponent(albumName) + '/';
           var albumPhotosKey = albumName + '/'
           // alert("albumname:" +albumName);
          // alert("albumphotokey:" +albumPhotosKey);
              s3.listObjects({Prefix: albumPhotosKey}, function(err, data) {
                if (err) {
                  return alert('There was an error viewing your album: ' + err.message);
                }
                // `this` references the AWS.Response instance that represents the response
                var href = this.request.httpRequest.endpoint.href;
                //var bucketUrl = href + albumBucketName + '/';
                  var bucketUrl = cloudFrontDomain + '/';
                  
                 //alert("bucketUrl:" +bucketUrl);

                var photos = data.Contents.map(function(photo) {
                    
                  var photoKey = photo.Key;
                    
               // alert('photoKey:' +photoKey);
                if(photoKey == "featured-earrings/" || photoKey == "featured-sarees/" || photoKey == "necklaces/" || photoKey == albumPhotosKey  || photoKey == "earrings/") {
                        //alert('photoKey:' +photoKey);
                }
               else {
                    
                    
                  var photoUrl = bucketUrl + encodeURIComponent(photoKey);
                  // alert('photoUrl:' +photoUrl);
                    
                    var params = {
                        Bucket: 'trukreations.com',
                         Key: photoKey
                     };
                    
                    s3.getObjectTagging(params, function(err, data) {
                       if (err) 
                           alert(err); 
                       else    {
                           console.log(data);
                           var obj = data;
                           var desc = obj.TagSet[2].Value
                          // alert(desc);
                           //alert('photourl:' + photoUrl);
                           //return desc;
                       }

                     });
                    
                    
                   //alert('desc:' + desc);
                    
                    var html = getHtml([
                        '<div class="col-sm-3">',
                          '<div class="card simpleCart_shelfItem">',
                            '<div class="card-block">',
                                '<h4 id="' +photoKey + '-title"' + 'class="card-title">' + 'card-title' + '</h4>',
                            '</div>',
                            '<img src="' + photoUrl + '" onclick="displayItemDetail(this)">',
                            '<div class="card-block">',
                                '<p id="' +photoKey + '-desc"' + 'class="card-text">desc</p>',
                                '<p id="' +photoKey + '-price"' + 'class="card-text">$</p>',
                            '</div>',
                        '</div>',
                    '</div>'
                        
                  ]);
                    
                  
                    return html;
                    }
                });
               
                var htmlTemplate = [
                    getHtml(photos),
                ]
                document.getElementById(replaceElementId).innerHTML = getHtml(htmlTemplate);
                //alert(htmlTemplate);
              
              });
        }
        
        
        
        
        function getHtml(template) {
          return template.join('\n');
        }

        
            
    function viewTags(albumName) {
            //alert(albumName);
             // var albumPhotosKey = encodeURIComponent(albumName) + '/';
          var albumPhotosKey = albumName + '/'
           // alert("albumname:" +albumName);
            //alert("albumphotokey:" +albumPhotosKey);
              s3.listObjects({Prefix: albumPhotosKey}, function(err, data) {
                if (err) {
                  return alert('There was an error viewing your album: ' + err.message);
                }
                // `this` references the AWS.Response instance that represents the response
                var href = this.request.httpRequest.endpoint.href;
                var bucketUrl = href + albumBucketName + '/';
                  
                 //alert("bucketUrl:" +bucketUrl);

                var photos = data.Contents.map(function(photo) {
                    
                  var photoKey = photo.Key;
                    
                    if(photoKey == "featured-earrings/" || photoKey == "featured-sarees/" || photoKey == "necklaces/" || photoKey == albumPhotosKey || photoKey == "earrings/") {
                        //alert('photoKey:' +photoKey);
                    }   
                    else {
                    
                        var params = {
                            Bucket: 'trukreations.com',
                             Key: photoKey
                         };

                        s3.getObjectTagging(params, function(err, data) {
                           if (err) 
                               alert(err); 
                           else    {
                               console.log(data);
                               var obj = data;
                               var price = obj.TagSet[1].Value;
                               var desc = obj.TagSet[2].Value;
                               var title = obj.TagSet[3].Value;
                               
                              // alert(photoKey+"-title");

                               document.getElementById(photoKey+"-title").innerHTML = '<h4 class="card-title item_name">' + title + '</h4>';
                               document.getElementById(photoKey+"-desc").innerHTML = '<p class="card-text">' + desc + '</p>',
                                document.getElementById(photoKey+"-price").innerHTML = '<p class="card-link item_price"><span style="color:red"> $' + price +   '</span>&nbsp;&nbsp;<button class="btn btn-success item_add">Add to Cart</button></p>';
                           }

                         });

                    
                    }
                
                //alert(htmlTemplate);
              });
            });
        }


function replaceSareePageTitle(category) {
    if(category == 'silk') 
        document.getElementById("id_saree_page_title").innerHTML = 'Silk Sarees';
    else if(category == 'art-silk') 
        document.getElementById("id_saree_page_title").innerHTML = 'Art Silk Sarees';
    else if(category == 'cotton') 
        document.getElementById("id_saree_page_title").innerHTML = 'Cotton Sarees';
    
    
}


function displayItemDetail(img) {
                //alert(img.src);
                window.location.href =  'itemDetail.html?itemId=' +img.id;

            }



 function viewItemDetail() {
            
     
     
            var queryString = decodeURIComponent(window.location.search);
            queryString = queryString.substring(1);
            var itemId =  queryString.substring(queryString.indexOf("=")+1);
            //alert('itemId=' +itemId);
     
             var params = {
                            TableName: "tru_inventory_item",
                            Key: {
                                "item_id": itemId
                            }
                        };

             docClient.get(params, function (err, data) {
                            if (err) {
                                console.log(JSON.stringify(err));
                            } else {
                                 var item = data.Item;
                                 console.log("item image url" +JSON.stringify(item.item_image_url));
                                 document.getElementById("id_itemDetailImg").src = cloudFrontDomain + "/" + item.item_image_url;
                                   document.getElementById("id_itemDetailTitle").innerHTML = '<h2 class="card-title item_name">' + item.title + '</h2>';
                                  document.getElementById("id_itemDetailId").innerHTML = '<p class="card-text">Item# ' + itemId + '</p>',
                                   document.getElementById("id_itemDetailDesc").innerHTML = '<p class="card-text">' + item.long_desc + '</p>',
                                   document.getElementById("id_itemDetailPrice").innerHTML = '<p class="card-link item_price">Price: <span style="color:red"> $' + item.price + '</span></p>';
                            }

                        });
    
     
           
                    
     
 }
                
               
        
        
        
        // create s3 object tags
            
            function createS3ObjectTags() {
                
              //  addPhoto('featured-necklaces');
                
               var category = document.getElementById("id_category").value;
                var fname = document.getElementById("id_fname").value;
                var itemId = document.getElementById("id_itemid").value;
                var itemPrice = document.getElementById("id_itemprice").value;
                var itemTitle = document.getElementById("id_itemtitle").value;
                var itemShortDesc = document.getElementById("id_itemshortdesc").value;
                var itemLongDesc = document.getElementById("id_itemlongdesc").value;
                var key = category +'/' + fname;
                
               // alert(itemId + itemPrice +key);
                
                var params = {
                  Bucket: "trukreations.com", 
                  Key: key, 
                  Tagging: {
                   TagSet: [
                      {
                     Key: "itemId", 
                     Value: itemId
                    },
                        {
                     Key: "price", 
                     Value: itemPrice
                    },
                       {
                     Key: "title", 
                     Value: itemTitle
                    }, 
                       {
                     Key: "shortDesc", 
                     Value: itemShortDesc
                    }, 
                       {
                     Key: "longDesc", 
                     Value: itemShortDesc
                    }
                    
                       
                   ]
                  }
                 };
                
              //  alert('before object tagging:' +itemId + itemPrice +itemTitle +itemShortDesc +key);
                 s3.putObjectTagging(params, function(err, data) {
                   if (err) console.log(err, err.stack); // an error occurred
                   else  {   
                       console.log('tagging successful');     
                       alert('tagging successful')
                          
                    }
                     // successful response
                   /*
                   data = {
                    VersionId: "null"
                   }
                   */
                 });
                
               // alert('after object tagging');
                
              

            }
            
    


function addPhoto() {
            
            var e = document.getElementById("id_category");
            var albumName = e.options[e.selectedIndex].text;
    
            
          var files = document.getElementById('id_itemfile').files;
          if (!files.length) {
            return alert('Please choose a file to upload first.');
          }
          var file = files[0];
          var fileName = file.name;
         // var albumPhotosKey = encodeURIComponent(albumName)+ '/';
            var albumPhotosKey = albumName + '/';
            
          document.getElementById('id_fname').value = fileName;
           

          var photoKey = albumPhotosKey + fileName;
          //  alert('photoKey-addphoto:' +photoKey);
            
          s3.upload({
            Key: photoKey,
            Body: file,
            ACL: 'public-read'
          }, function(err, data) {
            if (err) {
              console.log('There was an error uploading your photo: ', err.message);
            }
            console.log("upload successful");
            //alert("Upload successful");
          });
           // alert('photoKey-after:' +photoKey);
        }
        

function readURL(input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    $('#id_itemfile_img')
                        .attr('src', e.target.result)
                        .width(150)
                        .height(200);
                };

                reader.readAsDataURL(input.files[0]);
            }
        }
          
            
        