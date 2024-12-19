"use client";

import React from "react";
import { Button } from "@/components/ui/button";

const generateRandomNumber = (ridx: number, cidx: number) => (ridx + 1) * (cidx + 1);

export default function RandomNumberGrid() {
	const [hasClicked, setHasClicked] = React.useState(false);
	const [path, setPath] = React.useState<number[][]>([[]]);
	const grid = Array(20)
		.fill(null)
		.map((_, ridx) =>
			Array(20)
				.fill(null)
				.map((_, cidx) => generateRandomNumber(ridx, cidx)),
		);

	const [endpointQuery, setEndpointQuery] = React.useState({
		input: grid,
		query: {
			start: [-1, -1], // Initialize start as invalid
			end: [-1, -1], // Initialize end as invalid
		},
	});

	React.useEffect(() => {
		if (hasClicked) {
			async function PostRequest() { 
							const res = await fetch("http://localhost:4000/input", {
								method: "POST", // Ensure correct method
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify(endpointQuery),
							});

							const data = await res.json(); // Assume returning path
							setPath(data);
							setHasClicked(false)
			}
			PostRequest();
			
		}
	}, [hasClicked]);

	return (
		<div className="w-full">
			<h1 className="text-2xl font-bold mb-4">20x20 Random Number Grid</h1>
			<div className="grid grid-cols-20 grid-rows-20 gap-4">
				{grid.map((row, rowIndex) => (
					<div
						key={rowIndex}
						className="flex flex-wrap gap-4"
					>
						{row.map((number, colIndex) => (
							<Button
								key={colIndex}
								onClick={async () => {
									if (endpointQuery.query.start[0] === -1) {
										// Set start if not set
										setEndpointQuery({
											input: grid,
											query: {
												start: [rowIndex, colIndex],
												end: [endpointQuery.query.end[0], endpointQuery.query.end[1]],
											},
										});
									} else {
										// Set end and call API
										setEndpointQuery({
											input: grid,
											query: {
												...endpointQuery.query,
												end: [rowIndex, colIndex],
											},
										});
										setHasClicked(true);

										// Log the path to the console
									}
								}}
								className={"w-4 h-4 "+ (path.find(p => p[0] === rowIndex && p[1] === colIndex) ? "bg-green-500" : "bg-gray-200")}
							>
								{number}
							</Button>
						))}
					</div>
				))}
			</div>


		</div>
	);
}
