-- Two more condition grades below "Good".
alter type public.condition_grade add value if not exists 'fair';
alter type public.condition_grade add value if not exists 'well_used';
