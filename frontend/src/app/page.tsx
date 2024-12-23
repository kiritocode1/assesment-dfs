"use client";

import React from "react";
import { Button } from "@/components/ui/button";

const generateRandomNumber = (ridx: number, cidx: number) => (ridx + 1) * (cidx + 1);

interface EndpointQ {
	query: {
		start: number[];
		end: number[];
	};
}

interface MemoButton {
		rowIndex: number;
		colIndex: number;
		number: number;
		path: number[][];
		endpointQuery: EndpointQ;
		setEndpointQuery: React.Dispatch<
			React.SetStateAction<{
				query: {
					start: number[];
					end: number[];
				};
			}>
		>;
		setHasClicked: React.Dispatch<React.SetStateAction<boolean>>;
		}


const arePropsEqual = (prevProps: MemoButton, nextProps: MemoButton): boolean => {
	const StartPointEqual = prevProps.endpointQuery.query.start[0] === nextProps.endpointQuery.query.start[0] && prevProps.endpointQuery.query.start[1] === nextProps.endpointQuery.query.start[1];
	const EndPointEqual = prevProps.endpointQuery.query.end[0] === nextProps.endpointQuery.query.end[0] && prevProps.endpointQuery.query.end[1] === nextProps.endpointQuery.query.end[1];
	


		const prevInPath = prevProps.path.some((p) => p[0] === prevProps.rowIndex && p[1] === prevProps.colIndex);
		const nextInPath = nextProps.path.some((p) => p[0] === nextProps.rowIndex && p[1] === nextProps.colIndex);
	// not to rerender when hasClickedEqual is false
	//not to rerender when EndPointQuery is false
	// rerender when starrPointsEqual is false 
	// rerender when EndPointEqual is false
	// rerender when Path is true


	// console.log("HasClickedEqual: ", HasClickedEqual);
	// console.log("Prev: ", prevProps.endpointQuery.query.start[0], prevProps.endpointQuery.query.start[1], prevProps.endpointQuery.query.end[0], prevProps.endpointQuery.query.end[1]);
	// console.log("Next: ", nextProps.endpointQuery.query.start[0], nextProps.endpointQuery.query.start[1], nextProps.endpointQuery.query.end[0], nextProps.endpointQuery.query.end[1]);
    //? should return true when props are equal
	return StartPointEqual && EndPointEqual && prevInPath===nextInPath;

 }; 


const MemoisedButton = React.memo(
	({
		rowIndex,
		colIndex,
		number,
		path,
		endpointQuery,
		setEndpointQuery,
		setHasClicked,
	}:MemoButton) => {
		
			console.log("Rendering Button");
		return (
			<Button
				key={colIndex}
				onClick={async () => {
					if (endpointQuery.query.start[0] === -1) {
						// Set start if not set
						setEndpointQuery({
							query: {
								start: [rowIndex, colIndex],
								end: [endpointQuery.query.end[0], endpointQuery.query.end[1]],
							},
						});
					} else {
						// Set end and call API
						setEndpointQuery({
							query: {
								...endpointQuery.query,
								end: [rowIndex, colIndex],
							},
						});
						setHasClicked(true);

						// Log the path to the console
					}
				}}
				className={"w-4 h-4 " + (path.find((p) => p[0] === rowIndex && p[1] === colIndex) ? "bg-green-500" : "bg-gray-200")}
			>
				{number}
			</Button>
		);
	},
	arePropsEqual
);

MemoisedButton.displayName = "Button";

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
					body: JSON.stringify({ ...endpointQuery, input: grid }),
				});

				const data = await res.json(); // Assume returning path
				setPath(data);
				setHasClicked(false);
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
							<MemoisedButton
								key={colIndex}
								rowIndex={rowIndex}
								colIndex={colIndex}
								number={number}
								path={path}
								endpointQuery={endpointQuery}
								setEndpointQuery={setEndpointQuery}
								setHasClicked={setHasClicked}
								
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
