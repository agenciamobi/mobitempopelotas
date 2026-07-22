revoke execute on function public.handle_new_user_profile() from public;
revoke execute on function public.handle_new_user_profile() from anon;
revoke execute on function public.handle_new_user_profile() from authenticated;

grant execute on function public.handle_new_user_profile() to supabase_auth_admin;
