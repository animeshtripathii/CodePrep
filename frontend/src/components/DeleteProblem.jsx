import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-hot-toast';

const DeleteProblem = () => {
    const [problems, setProblems] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10); // Default items per page
    
    // Search state
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchProblems();
    }, [currentPage]);

    // Debounce search input cleanup and fetch
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchProblems();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to page 1 on search
    };

    const fetchProblems = async () => {
        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: limit,
                search: searchQuery // Add search parameter
            });
            const response = await axiosClient.get(`/problem/getAllProblem?${queryParams}`);
            if (response.data && response.data.problems) {
               setProblems(response.data.problems);
               setTotalPages(response.data.totalPages || 1);
            } else if (Array.isArray(response.data)) {
                setProblems(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch problems", error);
            // toast.error("Failed to fetch problems");
        }
    };

    // Pagination handlers
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        const loadingToast = toast.loading('Deleting problem...');
        
        try {
            const response = await axiosClient.delete(`/problem/delete/${id}`);
            toast.success(response.data.message || "Problem deleted successfully");
            fetchProblems(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Delete failed");
        } finally {
            toast.dismiss(loadingToast);
            setIsDeleting(false);
        }
    };

    return (
        <div className="glass-panel p-8 rounded-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-500">delete_forever</span> Delete Problem
                </h2>
                <div className="relative w-full md:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                    <input 
                        type="text" 
                        placeholder="Search problems..." 
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full bg-black/40 border border-[#0dccf2]/20 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0dccf2] transition-all placeholder:text-slate-600"
                    />
                </div>
            </div>
            <div className="mb-4 text-slate-400 text-sm">
                Select a problem to permanently delete it from the database.
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#0dccf2]/20 text-[#0dccf2] text-xs uppercase tracking-wider">
                            <th className="p-4">ID</th>
                            <th className="p-4">Title</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {problems.map((problem) => (
                            <tr key={problem._id || problem.id} className="border-b border-[#0dccf2]/10 hover:bg-[#0dccf2]/5 transition-colors">
                                <td className="p-4 font-mono text-slate-500">#{problem.sequenceNumber || problem._id?.toString().slice(-6)}</td>
                                <td className="p-4 font-bold text-slate-200">{problem.title}</td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => handleDelete(problem._id || problem.id, problem.title)}
                                        disabled={isDeleting}
                                        className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all font-medium text-xs uppercase tracking-wide disabled:opacity-50"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {problems.length === 0 && (
                            <tr>
                                <td colSpan="3" className="p-8 text-center text-slate-500">No problems found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6 border-t border-[#0dccf2]/10 pt-4">
                <div className="text-sm text-slate-400">
                    Page <span className="text-[#0dccf2] font-bold">{currentPage}</span> of <span className="text-[#0dccf2] font-bold">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg text-sm font-bold border border-[#0dccf2]/20 text-[#0dccf2] hover:bg-[#0dccf2]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Previous
                    </button>
                    <button 
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg text-sm font-bold border border-[#0dccf2]/20 text-[#0dccf2] hover:bg-[#0dccf2]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteProblem;
