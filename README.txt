Useful commands
===============

To find the number of entries having cast value
db.getCollection('epg_collections').find({"cast": {$exists:"true"}})

To find the first date of EPG data
 No correct method, I haven't found yet. However, use
"start_date":"2015-xx-xxT00:00:00.000Z" for search. Go backwards and find the
earliest date.
