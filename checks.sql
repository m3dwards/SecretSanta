-- people who have collected
Select us.name as "Name", ut.id as "BuyingFor"
from user_buying_for ubf
join users us on ubf.user = us.id
join users ut on ubf.buyingfor = ut.id
where ubf.event = 2

--Should always be 0!!
Select count(*)
from user_buying_for ubf
where (exists (select 1 from present_preference where "user" = ubf.user and event = ubf.event and wants_presents = false)
or exists (select 1 from present_preference where "user" = ubf.buyingfor and event = ubf.event and wants_presents = false))
and ubf.event = 2

-- how many are allocated (but might not be collected)
select count(*)
from user_buying_for ubf
where ubf.event = 2

--who has not collected
select u.name
from users u
join present_preference pp on pp.user = u.id and pp.wants_presents = true
where 
(not exists(select 1 from user_buying_for ubf where ubf.event = pp.event and ubf.user = u.id)
or exists (select 1 from user_buying_for ubf where ubf.event = pp.event and ubf.user = u.id and ubf.collected_on is null))
and pp.event = 2

--who is not doing presents
Select u.name
from present_preference pp
join users u on u.id = pp.user
where pp.wants_presents = false
and pp.event = 2

--who didn't set their present preference (and wont be included in presents)
select u.name
from users u
join user_event ue on ue.user = u.id
where not exists (select 1 from present_preference pp where pp.event = ue.event and pp.user = u.id)
and ue.event = 2

