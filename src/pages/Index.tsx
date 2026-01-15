// src/App.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
	const [todos, setTodos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchTodos = async () => {
			setLoading(true);
			setError(null);

			const { data, error } = await supabase
				.from('todos') // naam van je tabel
				.select('*'); // selecteer alle kolommen

			if (error) {
				setError(error.message);
			} else {
				setTodos(data);
			}

			setLoading(false);
		};

		fetchTodos();
	}, []);

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error: {error}</p>;

	return (
		<div>
			<h1>Todos</h1>
			<ul>
				{todos.map((todo) => (
					<li key={todo.id}>{todo.title}</li>
				))}
			</ul>
		</div>
	);
}
