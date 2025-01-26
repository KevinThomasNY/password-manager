import { useQuery } from "@tanstack/react-query";
import { getPasswords } from "@/api/password-api";

const Home = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: ["passwords"],
    queryFn: getPasswords,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error instanceof Error) return <div>An error has occurred: {error.message}</div>;

  return (
    <div>
      {data?.map((password) => (
        <div key={password.id}>
          <h3>{password.name}</h3>
          <p>Created At: {password.createdAt}</p>
          <p>Updated At: {password.updatedAt}</p>
          {password.image && <img src={password.image} alt={password.name} />}
          <br />
        </div>
      ))}
    </div>
  );
};

export default Home;
