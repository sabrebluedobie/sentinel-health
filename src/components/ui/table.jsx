import React from 'react';
export const Table = ({children})=> <table className="w-full text-sm">{children}</table>;
export const TableHeader = ({children})=> <thead className="bg-gray-50">{children}</thead>;
export const TableBody = ({children})=> <tbody>{children}</tbody>;
export const TableRow = ({children})=> <tr className="border-b">{children}</tr>;
export const TableHead = ({children})=> <th className="px-3 py-2 text-left font-medium">{children}</th>;
export const TableCell = ({children, className=''})=> <td className={`px-3 py-2 ${className}`}>{children}</td>;