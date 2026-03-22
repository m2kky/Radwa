import { getBookingProfile } from './actions';
import ProfileForm from './ProfileForm';
import s from '../Scheduling.module.css';

export const metadata = { title: 'Booking Profile | Admin' };

export default async function BookingProfilePage() {
    const profile = await getBookingProfile();

    return (
        <div>
            <div className={s.pageHeader}>
                <div>
                    <h1 className={s.pageTitle}>Booking Profile</h1>
                    <p className={s.pageSub}>Customize how you appear on your booking page</p>
                </div>
            </div>
            <div style={{ maxWidth: 680 }}>
                <ProfileForm profile={profile} />
            </div>
        </div>
    );
}
