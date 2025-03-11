import { UseQueryResult } from "@tanstack/react-query";
import { ProfileInformation as ProfileInfoType } from "@/api/user-api";
interface ProfileInformationProps {
  profileQuery: UseQueryResult<ProfileInfoType>;
}

const UpdateProfile = ({ profileQuery }: ProfileInformationProps) => {
  const {
    data: profileData,
    isLoading: profileIsLoading,
    isError: profileIsError,
  } = profileQuery;

  console.log(profileData);

  if (profileIsLoading) {
    return <div>Loading...</div>;
  }
  if (profileIsError) {
    return <div>Error loading profile information</div>;
  }
  return <div>UpdateProfile</div>;
};

export default UpdateProfile;
