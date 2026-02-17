// Placeholder for UpdateProblem component
import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-hot-toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const UpdateProblem = () => {
    // We need two states: 'list' (to pick a problem) and 'edit' (to update it)
    const [mode, setMode] = useState('list'); 
    const [problems, setProblems] = useState([]);
    const [selectedProblemId, setSelectedProblemId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10); // Default items per page

    // For the form
    const [codeTab, setCodeTab] = useState('startCode');

    // Validation schema (Same as create)
    const validateProblemData = z.object({
        title: z.string().min(1, "Title is required").trim(),
        description: z.string().min(10, "Description must be at least 10 characters").trim(),
        difficulty: z.enum(["easy", "medium", "hard"]),
        tags: z.array(z.string()),
        visibleTestCases: z.array(z.object({
            input: z.string().min(1, "Input is required"),
            output: z.string().min(1, "Output is required"),
            explanation: z.string().min(1, "Explanation is required")
        })),
        hiddenTestCases: z.array(z.object({
            input: z.string().min(1, "Input is required"),
            output: z.string().min(1, "Output is required")
        })),
        startCode: z.array(z.object({
            language: z.string().min(1, "Language is required"),
            initialCode: z.string().min(1, "Initial code is required")
        })),
        referenceSolution: z.array(z.object({
            language: z.string().min(1, "Language is required"),
            completeCode: z.string().min(1, "Complete code is required")
        })),
    });

    const { register, control, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
        resolver: zodResolver(validateProblemData),
        defaultValues: {
            title: '',
            description: '',
            difficulty: 'easy',
            tags: [],
            visibleTestCases: [],
            hiddenTestCases: [],
            startCode: [],
            referenceSolution: []
        }
    });

    const { fields: visibleFields, append: appendVisible, remove: removeVisible } = useFieldArray({ control, name: "visibleTestCases" });
    const { fields: hiddenFields, append: appendHidden, remove: removeHidden } = useFieldArray({ control, name: "hiddenTestCases" });
    const { fields: startCodeFields, append: appendStartCode, remove: removeStartCode } = useFieldArray({ control, name: "startCode" });
    const { fields: referenceFields, append: appendReference, remove: removeReference } = useFieldArray({ control, name: "referenceSolution" });
    
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");
    const [searchQuery, setSearchQuery] = useState(""); // Search state

    // Fetch problems on mount and when page changes
    useEffect(() => {
        // Debounce search
        const delayDebounceFn = setTimeout(() => {
            fetchProblems();
        }, 500);

        return () => clearTimeout(delayDebounceFn)
    }, [currentPage, searchQuery]);

    const fetchProblems = async () => {
        try {
            const response = await axiosClient.get(`/problem/getAllProblem?page=${currentPage}&limit=${limit}&search=${searchQuery}`);
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

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };

    const handleEditClick = async (problemId) => {
        setIsLoading(true);
        try {
            const response = await axiosClient.get(`/problem/problemById/${problemId}`);
            const problemData = response.data.problem || response.data;
            
            // Populate form
            const problemTags = problemData.tags || [];
            setTags(problemTags);
            reset({
                title: problemData.title,
                description: problemData.description,
                difficulty: problemData.difficulty,
                tags: problemTags,
                visibleTestCases: problemData.visibleTestCases || [],
                hiddenTestCases: problemData.hiddenTestCases || [],
                startCode: problemData.startCode || [],
                referenceSolution: problemData.referenceSolution || []
            });
            
            setSelectedProblemId(problemId);
            setMode('edit');
        } catch (error) {
            console.error("Failed to fetch problem details", error);
            toast.error("Failed to fetch problem details");
        } finally {
             setIsLoading(false);
        }
    };

    const onUpdate = async (data) => {
        setIsLoading(true);
        const loadingToast = toast.loading('Updating problem...');
        try {
            const response = await axiosClient.put(`/problem/update/${selectedProblemId}`, data);
            if (response.status === 200 || response.data.success) {
                toast.success(response.data.message || "Problem updated successfully");
                setMode('list');
                fetchProblems(); // Refresh list
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Update failed");
        } finally {
            toast.dismiss(loadingToast);
            setIsLoading(false);
        }
    };
    
    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (!tags.includes(newTag)) {
                const updatedTags = [...tags, newTag];
                setTags(updatedTags);
                setValue('tags', updatedTags, { shouldDirty: true });
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        const updatedTags = tags.filter(tag => tag !== tagToRemove);
        setTags(updatedTags);
        setValue('tags', updatedTags, { shouldDirty: true });
    };

    if (mode === 'list') {
        return (
            <div className="glass-panel p-8 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#0dccf2]">edit_note</span> Update Problem
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
                                            onClick={() => handleEditClick(problem._id || problem.id)}
                                            className="px-4 py-2 bg-[#0dccf2]/10 text-[#0dccf2] rounded-lg hover:bg-[#0dccf2]/20 transition-all font-medium text-xs uppercase tracking-wide"
                                        >
                                            Edit
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
    }

    // Edit Mode (Copying Form Structure from AdminPanel roughly, simplified for brevity but functional)
    return (
        <form onSubmit={handleSubmit(onUpdate)} className="space-y-8">
            <div className="flex items-center gap-4 mb-6">
                <button type="button" onClick={() => setMode('list')} className="text-slate-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-2xl font-bold">Editing: <span className="text-[#0dccf2]">{watch('title')}</span></h2>
            </div>
            
            {/* Basic Schema Section */}
            <section className="glass-panel p-8 rounded-2xl space-y-8" id="basic-schema">
                <h3 className="text-xl font-bold border-b border-[#0dccf2]/10 pb-4">Basic Info</h3>
                <div className="grid gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Title</label>
                        <input {...register("title")} className="w-full bg-black/40 border border-[#0dccf2]/20 rounded-xl px-4 py-3 text-slate-200" />
                        {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Description</label>
                        <textarea {...register("description")} className="w-full bg-black/40 border border-[#0dccf2]/20 rounded-xl px-4 py-3 text-slate-200" rows={5} />
                        {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
                    </div>
                    {/* Difficulty and Tags */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Difficulty</label>
                            <select {...register("difficulty")} className="w-full bg-black/40 border border-[#0dccf2]/20 rounded-xl px-4 py-3 text-slate-200">
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Tags</label>
                             <div className="w-full bg-black/40 border border-[#0dccf2]/20 rounded-xl px-4 py-2 flex flex-wrap gap-2 items-center min-h-[50px]">
                                {tags.map((tag, index) => (
                                    <span key={index} className="bg-[#0dccf2]/10 text-[#0dccf2] px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-2">
                                        {tag} <button type="button" onClick={() => removeTag(tag)}><span className="material-icons-round text-sm">close</span></button>
                                    </span>
                                ))}
                                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} className="bg-transparent border-none outline-none text-sm p-0 flex-grow min-w-[120px] text-slate-200" placeholder="Add tag..." />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
             {/* Test Cases Simplified for Edit (You can expand this to match full creation form if needed) */}
             <section className="glass-panel p-8 rounded-2xl space-y-8" id="test-case-engine">
                 <div className="flex justify-between items-center border-b border-[#0dccf2]/10 pb-4">
                    <h3 className="text-xl font-bold">Visible Test Cases</h3>
                    <button type="button" onClick={() => appendVisible({ input: '', output: '', explanation: '' })} className="text-[#0dccf2] text-sm font-bold">+ Add Case</button>
                 </div>
                 {visibleFields.map((field, index) => (
                     <div key={field.id} className="p-4 bg-black/30 rounded-xl border border-[#0dccf2]/10 grid gap-4">
                         <div className="flex justify-end"><button type="button" onClick={() => removeVisible(index)} className="text-red-400 text-xs">Remove</button></div>
                         <input {...register(`visibleTestCases.${index}.input`)} placeholder="Input" className="w-full bg-black/40 p-2 rounded border border-[#0dccf2]/10 text-slate-200" />
                         <input {...register(`visibleTestCases.${index}.output`)} placeholder="Output" className="w-full bg-black/40 p-2 rounded border border-[#0dccf2]/10 text-slate-200" />
                         <input {...register(`visibleTestCases.${index}.explanation`)} placeholder="Explanation" className="w-full bg-black/40 p-2 rounded border border-[#0dccf2]/10 text-slate-200" />
                     </div>
                 ))}
             </section>

             {/* Hidden Test Cases */}
             <section className="glass-panel p-8 rounded-2xl space-y-8" id="hidden-test-cases">
                 <div className="flex justify-between items-center border-b border-[#0dccf2]/10 pb-4">
                    <h3 className="text-xl font-bold">Hidden Test Cases</h3>
                    <button type="button" onClick={() => appendHidden({ input: '', output: '' })} className="text-[#0dccf2] text-sm font-bold">+ Add Case</button>
                 </div>
                 {hiddenFields.map((field, index) => (
                     <div key={field.id} className="p-4 bg-black/30 rounded-xl border border-[#0dccf2]/10 grid gap-4">
                         <div className="flex justify-end"><button type="button" onClick={() => removeHidden(index)} className="text-red-400 text-xs">Remove</button></div>
                         <input {...register(`hiddenTestCases.${index}.input`)} placeholder="Input" className="w-full bg-black/40 p-2 rounded border border-[#0dccf2]/10 text-slate-200" />
                         <input {...register(`hiddenTestCases.${index}.output`)} placeholder="Output" className="w-full bg-black/40 p-2 rounded border border-[#0dccf2]/10 text-slate-200" />
                     </div>
                 ))}
             </section>

             {/* Code Start/Ref Simplified */}
             <section className="glass-panel p-8 rounded-2xl space-y-8" id="code-architect">
                <div className="flex gap-4 border-b border-[#0dccf2]/10 pb-4">
                    <button type="button" onClick={() => setCodeTab('startCode')} className={`font-bold ${codeTab === 'startCode' ? 'text-[#0dccf2]' : 'text-slate-500'}`}>Start Code</button>
                    <button type="button" onClick={() => setCodeTab('referenceSolution')} className={`font-bold ${codeTab === 'referenceSolution' ? 'text-[#0dccf2]' : 'text-slate-500'}`}>Reference Solution</button>
                </div>
                {codeTab === 'startCode' && (
                    <div className="space-y-4">
                         {startCodeFields.map((field, index) => (
                             <div key={field.id} className="p-4 bg-black/30 rounded-xl border border-[#0dccf2]/10 space-y-2">
                                 <div className="flex justify-between">
                                     <select {...register(`startCode.${index}.language`)} className="bg-black/40 text-slate-200 border border-[#0dccf2]/10 rounded p-1">
                                         <option value="java">Java</option>
                                         <option value="python">Python</option>
                                         <option value="c++">C++</option>
                                         <option value="javascript">JavaScript</option>
                                     </select>
                                     <button type="button" onClick={() => removeStartCode(index)} className="text-red-400 text-xs">Remove</button>
                                 </div>
                                 <textarea {...register(`startCode.${index}.initialCode`)} className="w-full bg-black/40 p-2 rounded border border-[#0dccf2]/10 text-slate-200 font-mono" rows={5} placeholder="Initial Code" />
                             </div>
                         ))}
                         <button type="button" onClick={() => appendStartCode({ language: 'java', initialCode: '' })} className="w-full py-2 bg-[#0dccf2]/10 text-[#0dccf2] rounded text-sm font-bold">+ Add Language</button>
                    </div>
                )}
                {codeTab === 'referenceSolution' && (
                    <div className="space-y-4">
                         {referenceFields.map((field, index) => (
                             <div key={field.id} className="p-4 bg-black/30 rounded-xl border border-[#0dccf2]/10 space-y-2">
                                 <div className="flex justify-between">
                                     <select {...register(`referenceSolution.${index}.language`)} className="bg-black/40 text-slate-200 border border-[#0dccf2]/10 rounded p-1">
                                         <option value="java">Java</option>
                                         <option value="python">Python</option>
                                         <option value="c++">C++</option>
                                         <option value="javascript">JavaScript</option>
                                     </select>
                                     <button type="button" onClick={() => removeReference(index)} className="text-red-400 text-xs">Remove</button>
                                 </div>
                                 <textarea {...register(`referenceSolution.${index}.completeCode`)} className="w-full bg-black/40 p-2 rounded border border-[#0dccf2]/10 text-slate-200 font-mono" rows={5} placeholder="Complete Solution" />
                             </div>
                         ))}
                         <button type="button" onClick={() => appendReference({ language: 'java', completeCode: '' })} className="w-full py-2 bg-[#0dccf2]/10 text-[#0dccf2] rounded text-sm font-bold">+ Add Solution</button>
                    </div>
                )}
             </section>

             <button type="submit" disabled={isLoading} className="w-full py-4 bg-[#0dccf2] text-[#051518] font-bold rounded-xl hover:shadow-[0_0_20px_#0dccf2] transition-all">
                 {isLoading ? 'Updating...' : 'Update Problem'}
             </button>
        </form>
    );

};

export default UpdateProblem;
